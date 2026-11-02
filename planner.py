import copy
import difflib
import re
import time

import numpy as np
from scipy.optimize import lsq_linear

from llm import send_prompt_json
from prompts import SYSTEM_PROMPT, get_keywords
from prompts import build_nutrition_context, build_grounded_prompt
from nutrition import calculate_day, calculate_item
from nutrition import restricted_words, find_violations


MAX_ATTEMPTS = 3
RETRY_WAIT = 10  # seconds to wait after a failed Gemini call
TOLERANCE = 10  # percent
NUTRIENTS = ["calories", "protein", "carbs", "fat"]
MIN_FACTOR = 0.5   # grams may shrink to half of what Gemini chose
MAX_FACTOR = 2.0   # or grow to double
ROUND_TO = 5       # round grams to the nearest 5 g
REG_WEIGHT = 0.05  # small pull towards Gemini's original amounts
MEAL_WEIGHT = 0.2
MAX_GRAMS = 250
MEAL_SHARES = {"breakfast": 0.25, "lunch": 0.35,
               "snack": 0.10, "dinner": 0.30}


def _meal_rows(plan, slots, cal_per_gram, cal_target):
    """Extra solver rows: each meal's calories should be close
    to its share of the day's calorie target."""
    rows = []
    for m, meal in enumerate(plan.get("meals", [])):
        name = str(meal.get("meal", "")).strip().lower()
        share = MEAL_SHARES.get(name)
        if share is None:
            continue
        row = [c if s[0] == m else 0.0
               for s, c in zip(slots, cal_per_gram)]
        if any(row):
            rows.append(np.array(row) / (share * cal_target))
    return rows


def adjust_grams(plan, profile, min_factor=MIN_FACTOR, max_factor=MAX_FACTOR):
    """Keep Gemini's foods, but solve the grams so the whole day is as close
    as possible to all four targets. Returns a new plan."""
    slots = []    # (meal index, item index) of every adjustable item
    columns = []  # nutrient values per gram for each of those items
    start = []    # the grams Gemini chose

    for m, meal in enumerate(plan.get("meals", [])):
        for i, item in enumerate(meal.get("items") or []):
            info = calculate_item(item.get("food"), 100)
            try:
                grams = float(item.get("grams"))
            except (TypeError, ValueError):
                continue
            if info is None or grams <= 0:
                continue
            slots.append((m, i))
            columns.append([info[n] / 100 for n in NUTRIENTS])
            start.append(grams)

    if not slots:
        return plan

    targets = np.array([profile[n] for n in NUTRIENTS], dtype=float)
    if (targets <= 0).any():
        return plan

    # Each nutrient row is divided by its target, so every nutrient is
    # judged by percent error. Extra rows keep grams close to Gemini's.
    start = np.array(start)
    fit = np.array(columns).T / targets[:, None]
    pull = REG_WEIGHT * np.diag(1 / start)
    cal = [col[0] for col in columns]
    meal_rows = _meal_rows(plan, slots, cal, targets[0])
    parts = [fit, pull]
    goal = [np.ones(len(NUTRIENTS)),
            REG_WEIGHT * np.ones(len(start))]
    if meal_rows:
        parts.insert(1, MEAL_WEIGHT * np.array(meal_rows))
        goal.insert(1, MEAL_WEIGHT * np.ones(len(meal_rows)))
    matrix = np.vstack(parts)
    goal = np.concatenate(goal)
    lower = np.minimum(start * min_factor, MAX_GRAMS / 2)
    upper = np.minimum(start * max_factor, MAX_GRAMS)
    solution = lsq_linear(matrix, goal, bounds=(lower, upper))
    new_plan = copy.deepcopy(plan)
    for (m, i), grams in zip(slots, solution.x):
        rounded = max(ROUND_TO, round(grams / ROUND_TO) * ROUND_TO)
        new_plan["meals"][m]["items"][i]["grams"] = rounded
    return new_plan


def offered_names(context):
    """Food names that were offered to Gemini in the prompt."""
    names = []
    for line in context.splitlines():
        match = re.match(r"- (.+?) \(per 100 g\):", line)
        if match:
            names.append(match.group(1))
    return names


def _first_word(name):
    return str(name).split(",")[0].strip().lower()


def repair_names(plan, names, cutoff=0.4):
    """Swap a food name the database does not know for the closest offered
    name that starts with the same word. Returns (new_plan, [(old, new)])."""
    new_plan = copy.deepcopy(plan)
    fixed = []
    for meal in new_plan.get("meals", []):
        for item in meal.get("items") or []:
            food = item.get("food")
            if calculate_item(food, 100) is not None:
                continue
            same = {n.lower(): n for n in names
                    if _first_word(n) == _first_word(food)}
            close = difflib.get_close_matches(
                str(food).lower(), list(same), n=1, cutoff=cutoff)
            if close:
                item["food"] = same[close[0]]
                fixed.append((food, same[close[0]]))
    return new_plan, fixed


def check_plan(result, tolerance=TOLERANCE):
    """Return a list of problems found in a calculated plan (empty = plan is good)."""
    problems = []
    bad = result.get("violations") or []
    if bad:
        problems.append(
            "These break the user's allergy or diet rules and must "
            "NOT be used, replace them: " + ", ".join(bad)
        )
    if result["not_found"]:
        problems.append(
            "These foods are not in the list. Use only exact names "
            "from the list: " + ", ".join(result["not_found"])
        )
    for nutrient, c in result["comparison"].items():
        pct = c["percent_error"]
        if pct is None or abs(pct) <= tolerance:
            continue
        direction = "too high" if pct > 0 else "too low"
        more = "more" if pct < 0 else "less"
        problems.append(
            f"{nutrient} is {direction}: the plan gives {c['actual']} against "
            f"a target of {c['target']} ({pct}%). Grams are fixed "
            f"automatically, so swap or add foods that give {more} {nutrient}."
        )
    return problems


def describe_plan(result):
    """Turn a calculated plan into short text, so Gemini can see it next time."""
    lines = []
    for meal in result["meals"]:
        items = ", ".join(f"{i['food']} {i['grams']:g} g" for i in meal["items"])
        lines.append(f"{meal['meal']}: {items}")
    return "\n".join(lines)


def _score(result):
    """Lower is better: total percent error, heavy penalty for unknown foods."""
    error = sum(abs(c["percent_error"] or 0) for c in result["comparison"].values())
    violations = result.get("violations") or []
    penalty = 100 * len(result["not_found"])
    penalty += 1000 * len(violations)
    return error + penalty


def generate_meal_plan(profile, max_attempts=MAX_ATTEMPTS, tolerance=TOLERANCE):
    """Gemini picks foods, code solves the grams, the database gives the real
    totals. Retries with feedback until close enough to the targets."""
    restricted = restricted_words(profile)
    context = build_nutrition_context(
        get_keywords(profile), exclude_words=restricted)
    names = offered_names(context)
    feedback = ""
    best = None
    last_error = None
    got_a_plan = False

    for attempt in range(1, max_attempts + 1):
        try:
            prompt = build_grounded_prompt(profile, context, feedback)
            plan = send_prompt_json(prompt, system_prompt=SYSTEM_PROMPT)
            plan, fixed = repair_names(plan, names)
            if fixed:
                print("   Repaired names:", fixed)
            plan = adjust_grams(plan, profile)
            result = calculate_day(plan, profile)
            result["violations"] = find_violations(result, restricted)
        except Exception as error:
            last_error = error
            feedback = "Last reply was unusable. Use the exact JSON structure."
            print(f"Attempt {attempt} failed: {error}")
            time.sleep(RETRY_WAIT)  # Gemini is often busy (503), so wait
            continue
        got_a_plan = True
        problems = check_plan(result, tolerance)
        score = _score(result)
        if not result["violations"] and (
                best is None or score < best["score"]):
            best = {"result": result, "score": score,
                    "attempt": attempt, "problems": problems}

        print(f"Attempt {attempt}: {len(problems)} problem(s), "
              f"error score {score:.1f}")
        if not problems:
            break
        feedback = (
            "Your previous plan, with real totals from the database:\n"
            + describe_plan(result)
            + "\n\nProblems to fix:\n"
            + "\n".join(f"- {p}" for p in problems)
        )

    if best is None:
        if not got_a_plan:
            raise RuntimeError(f"Gemini request failed: {last_error}")
        raise RuntimeError("No plan passed the allergy and diet check.")
    return {
        "result": best["result"],
        "passed": not best["problems"],
        "best_attempt": best["attempt"],
        "problems_left": best["problems"],
    }


if __name__ == "__main__":
    sample = {
        "calories": 2000, "protein": 110, "carbs": 230, "fat": 65,
        "diet": "Vegetarian", "allergies": ["Nuts", "Soy"],
        "preferences": ["High Protein"],
        "cuisine": "Indian",
        "protein_preference": ["Lentils", "Chickpeas"],
    }  
    output = generate_meal_plan(sample)
    result = output["result"]

    for meal in result["meals"]:
        print(f"\n{meal['meal']}: {meal['dish']}")
        for item in meal["items"]:
            print(f"   {item['grams']:>6.0f} g  {item['food']}"
                  f"  ->  {item['calories']} kcal")
        print("   Meal total:", meal["totals"])

    print("\nDay totals:", result["day_totals"])
    for n, c in result["comparison"].items():
        print(f"{n:9} target {c['target']:>6}  actual {c['actual']:>7}"
              f"  ({c['percent_error']}%)")

    print("\nPassed:", output["passed"], "| best attempt:", output["best_attempt"])
    print("Problems left:", output["problems_left"])
    