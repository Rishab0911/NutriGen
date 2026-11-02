from llm import send_prompt_json
from prompts import SYSTEM_PROMPT, get_keywords, build_nutrition_context, build_grounded_prompt
from nutrition import calculate_day

MAX_ATTEMPTS = 3
TOLERANCE = 10  # percent


def check_plan(result, tolerance=TOLERANCE):
    """Return a list of problems found in a calculated plan (empty list = plan is good)."""
    problems = []
    if result["not_found"]:
        problems.append(
            "These foods are not in the list. Use only exact names from the list: "
            + ", ".join(result["not_found"])
        )
    for nutrient, c in result["comparison"].items():
        pct = c["percent_error"]
        if pct is None or abs(pct) <= tolerance:
            continue
        direction = "too high" if pct > 0 else "too low"
        problems.append(
            f"{nutrient} is {direction}: the plan gives {c['actual']} against a target of "
            f"{c['target']} ({pct}%). Change the grams so it is within {tolerance}% of the target."
        )
    return problems


def describe_plan(result):
    """Turn a calculated plan into short text, so Gemini can see what it produced last time."""
    lines = []
    for meal in result["meals"]:
        items = ", ".join(f"{i['food']} {i['grams']:g} g" for i in meal["items"])
        lines.append(f"{meal['meal']}: {items}")
    return "\n".join(lines)


def _score(result):
    """Lower is better: total percent error, with a heavy penalty for unknown foods."""
    error = sum(abs(c["percent_error"] or 0) for c in result["comparison"].values())
    return error + 100 * len(result["not_found"])


def generate_meal_plan(profile, max_attempts=MAX_ATTEMPTS, tolerance=TOLERANCE):
    """Generate a one-day plan, calculate real totals from the database,
    and retry with feedback until it is close enough to the targets."""
    context = build_nutrition_context(get_keywords(profile))
    feedback = ""
    best = None

    for attempt in range(1, max_attempts + 1):
        try:
            prompt = build_grounded_prompt(profile, context, feedback)
            plan = send_prompt_json(prompt, system_prompt=SYSTEM_PROMPT)
            result = calculate_day(plan, profile)
        except Exception as error:
            feedback = "The previous reply could not be used. Follow the JSON structure exactly."
            print(f"Attempt {attempt} failed: {error}")
            continue

        problems = check_plan(result, tolerance)
        score = _score(result)
        if best is None or score < best["score"]:
            best = {"result": result, "score": score, "attempt": attempt, "problems": problems}

        print(f"Attempt {attempt}: {len(problems)} problem(s)")
        if not problems:
            break
        feedback = (
            "Your previous plan, with real totals calculated from the database:\n"
            + describe_plan(result)
            + "\n\nProblems to fix:\n"
            + "\n".join(f"- {p}" for p in problems)
        )

    if best is None:
        raise RuntimeError("Could not generate a usable meal plan.")

    return {
        "result": best["result"],
        "passed": not best["problems"],
        "best_attempt": best["attempt"],
        "problems_left": best["problems"],
    }


if __name__ == "__main__":
    sample = {
        "calories": 2000, "protein": 110, "carbs": 230, "fat": 65,
        "diet": "Non-Vegetarian", "allergies": ["Peanuts"], "preferences": ["High Protein"],
    }
    output = generate_meal_plan(sample)
    result = output["result"]

    for meal in result["meals"]:
        print(f"\n{meal['meal']}: {meal['dish']}")
        for item in meal["items"]:
            print(f"   {item['grams']:>6.0f} g  {item['food']}  ->  {item['calories']} kcal")
        print("   Meal total:", meal["totals"])

    print("\nDay totals:", result["day_totals"])
    for n, c in result["comparison"].items():
        print(f"{n:9} target {c['target']:>6}  actual {c['actual']:>7}  ({c['percent_error']}%)")

    print("\nPassed:", output["passed"], "| best attempt:", output["best_attempt"])
    print("Problems left:", output["problems_left"])