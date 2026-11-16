import json
import os
import time

import time
from datetime import datetime

from jsonschema import Draft202012Validator

from nutrition import find_violations, restricted_words
from proactive import UserState, detect_triggers

TOLERANCE = 10  # percent, the same limit the planner uses
NUTRIENTS = ["calories", "protein", "carbs", "fat"]
MEAL_NAMES = ["Breakfast", "Lunch", "Snack", "Dinner"]


def absolute_error(actual, target):
    """How far actual is from the target, in the same unit."""
    return abs(actual - target)


def percentage_error(actual, target):
    """Absolute error as a percent of the target. None if target is 0."""
    if not target:
        return None
    return abs(actual - target) / target * 100


def mae(values):
    """Mean absolute error: pass a list of absolute errors, get their mean.
    None entries are ignored. Returns None if nothing is left."""
    values = [v for v in values if v is not None]
    if not values:
        return None
    return round(sum(values) / len(values), 1)


def evaluate_plan(result, tolerance=TOLERANCE):
    """Score one plan. `result` is output["result"] from generate_meal_plan."""
    per_nutrient = {}
    for n in NUTRIENTS:
        c = result["comparison"][n]
        pct = percentage_error(c["actual"], c["target"])
        per_nutrient[n] = {
            "target": c["target"],
            "actual": c["actual"],
            "absolute_error": round(absolute_error(c["actual"], c["target"]), 1),
            "percentage_error": None if pct is None else round(pct, 1),
        }
    pcts = [v["percentage_error"] for v in per_nutrient.values()]
    known = [p for p in pcts if p is not None]
    return {
        "per_nutrient": per_nutrient,
        "mean_percentage_error": mae(pcts),
        "within_tolerance": bool(known) and all(p <= tolerance for p in known),
    }


def summarize(evaluations):
    """Combine the scores of many plans (for the 12 Nov test dataset)."""
    count = len(evaluations)
    per_nutrient_mae = {
        n: mae([e["per_nutrient"][n]["absolute_error"] for e in evaluations])
        for n in NUTRIENTS
    }
    passed = sum(1 for e in evaluations if e["within_tolerance"])
    return {
        "plans": count,
        "mae": per_nutrient_mae,
        "mean_percentage_error": mae(
            [e["mean_percentage_error"] for e in evaluations]),
        "within_tolerance_rate": round(passed / count, 2) if count else None,
    }


def _numbers(keys):
    """Schema for an object that must contain these keys as numbers."""
    return {
        "type": "object",
        "required": list(keys),
        "properties": {k: {"type": "number"} for k in keys},
    }


PLAN_SCHEMA = {
    "type": "object",
    "required": ["meals", "day_totals", "comparison", "not_found"],
    "properties": {
        "meals": {
            "type": "array", "minItems": 4, "maxItems": 4,
            "items": {
                "type": "object",
                "required": ["meal", "dish", "totals", "items", "not_found"],
                "properties": {
                    "meal": {"enum": MEAL_NAMES},
                    "dish": {"type": "string", "minLength": 1},
                    "totals": _numbers(NUTRIENTS),
                    "not_found": {"type": "array"},
                    "items": {
                        "type": "array", "minItems": 1,
                        "items": {
                            "type": "object",
                            "required": ["food", "grams"] + NUTRIENTS,
                            "properties": {
                                "food": {"type": "string", "minLength": 1},
                                "grams": {"type": "number",
                                          "exclusiveMinimum": 0},
                                **{n: {"type": "number"} for n in NUTRIENTS},
                            },
                        },
                    },
                },
            },
        },
        "day_totals": _numbers(NUTRIENTS),
        "comparison": {
            "type": "object",
            "required": NUTRIENTS,
            "properties": {
                n: {
                    "type": "object",
                    "required": ["target", "actual", "difference",
                                 "percent_error"],
                    "properties": {
                        "target": {"type": "number"},
                        "actual": {"type": "number"},
                        "difference": {"type": "number"},
                        "percent_error": {"type": ["number", "null"]},
                    },
                }
                for n in NUTRIENTS
            },
        },
        "not_found": {"type": "array", "items": {"type": "string"}},
    },
}


def check_structure(result):
    """Check that a plan has the structure the backend expects.
    Returns a list of problems (empty list = the structure is valid)."""
    validator = Draft202012Validator(PLAN_SCHEMA)
    problems = []
    for error in validator.iter_errors(result):
        where = "/".join(str(p) for p in error.absolute_path) or "top level"
        problems.append(f"{where}: {error.message}")
    return sorted(problems)


def time_call(func, *args, **kwargs):
    """Run func(*args, **kwargs). Returns (its result, seconds taken)."""
    start = time.perf_counter()
    value = func(*args, **kwargs)
    return value, round(time.perf_counter() - start, 2)

def check_compliance(result, profile):
    """Does the plan respect the user's allergies, diet and restrictions?"""
    banned = restricted_words(profile)
    violations = find_violations(result, banned)
    return {"compliant": not violations, "violations": violations}


def compliance_rate(checks):
    """Share of plans that were compliant (0 to 1). None if no plans."""
    if not checks:
        return None
    ok = sum(1 for c in checks if c["compliant"])
    return round(ok / len(checks), 2)


def _at(hour, minute=0):
    return datetime(2026, 11, 14, hour, minute)


def _case(name, now, calories, protein, last_meal, expected):
    return {"name": name, "now": now, "calories": calories,
            "protein": protein, "last_meal": last_meal,
            "expected": expected}


# Scenarios for a user with targets of 2000 kcal and 100 g protein.
TRIGGER_CASES = [
    _case("quiet before 11 am", _at(9), 0, 0, None, []),
    _case("no meal yet at noon", _at(12), 0, 0, None, ["no_meal_yet"]),
    _case("long gap", _at(14), 800, 40, _at(8), ["long_gap"]),
    _case("short gap is fine", _at(14), 800, 40, _at(12), []),
    _case("no nudges at night", _at(23), 0, 0, None, []),
    _case("no nudges before waking", _at(6), 0, 0, None, []),
    _case("evening low intake", _at(19), 500, 20, _at(18),
          ["low_calories", "low_protein"]),
    _case("over calories", _at(14), 2300, 90, _at(13), ["over_calories"]),
    _case("on track in the evening", _at(19), 1500, 90, _at(17), []),
    _case("several triggers", _at(20), 2300, 30, _at(12),
          ["long_gap", "over_calories", "low_protein"]),
]


def _case_state(case):
    state = UserState("eval", 2000, 100)
    state.calories_logged = case["calories"]
    state.protein_logged = case["protein"]
    state.last_meal_time = case["last_meal"]
    return state


def evaluate_triggers(cases=None):
    """Run detect_triggers on labeled scenarios and report its accuracy.
    Only the set of triggers is compared, not their order."""
    cases = TRIGGER_CASES if cases is None else cases
    wrong = []
    for case in cases:
        got = sorted(detect_triggers(_case_state(case), case["now"]))
        want = sorted(case["expected"])
        if got != want:
            wrong.append({"name": case["name"], "expected": want, "got": got})
    total = len(cases)
    correct = total - len(wrong)
    return {
        "cases": total,
        "correct": correct,
        "accuracy": round(correct / total, 2) if total else None,
        "wrong": wrong,
    }
PROFILES_PATH = "data/test_profiles.json"
RESULTS_PATH = "result/evaluation_results.json"


def load_profiles(path=PROFILES_PATH):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def run_evaluation(profiles, generate=None, pause_seconds=1):
    """Run the planner on every profile and score each plan.
    `generate` defaults to generate_meal_plan (tests pass a fake one)."""
    if generate is None:
        from planner import generate_meal_plan as generate
    rows = []
    for item in profiles:
        profile = item["profile"]
        row = {"name": item["name"]}
        try:
            output, seconds = time_call(generate, profile)
        except Exception as error:
            row.update({"ok": False, "error": str(error)})
        else:
            result = output["result"]
            row.update({
                "ok": True,
                "seconds": seconds,
                "passed": output["passed"],
                "attempt": output["best_attempt"],
                "score": evaluate_plan(result),
                "structure_problems": check_structure(result),
                "compliance": check_compliance(result, profile),
            })
        rows.append(row)
        time.sleep(pause_seconds)
    return rows


def summarize_run(rows):
    """Numbers for the whole run: accuracy, compliance, structure, speed."""
    done = [r for r in rows if r["ok"]]
    times = [r["seconds"] for r in done]
    return {
        "profiles": len(rows),
        "generated": len(done),
        "failed": [{"name": r["name"], "error": r["error"]}
                   for r in rows if not r["ok"]],
        "accuracy": summarize([r["score"] for r in done]),
        "planner_passed": sum(1 for r in done if r["passed"]),
        "compliance_rate": compliance_rate([r["compliance"] for r in done]),
        "structure_valid": sum(1 for r in done if not r["structure_problems"]),
        "mean_seconds": mae(times),
        "max_seconds": max(times) if times else None,
    }


def save_results(rows, summary, path=RESULTS_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "rows": rows}, f, indent=2)


def print_report(rows, summary):
    print(f"{'profile':26} {'passed':7} {'tries':5} {'err%':>5} "
          f"{'safe':5} {'format':6} {'sec':>5}")
    for r in rows:
        if not r["ok"]:
            print(f"{r['name']:26} FAILED: {r['error'][:60]}")
            continue
        err = str(r["score"]["mean_percentage_error"])
        safe = str(r["compliance"]["compliant"])
        fmt = str(not r["structure_problems"])
        print(f"{r['name']:26} {str(r['passed']):7} {r['attempt']:<5} "
              f"{err:>5} {safe:5} {fmt:6} {r['seconds']:>5}")
    acc = summary["accuracy"]
    print()
    print("Generated:", summary["generated"], "of", summary["profiles"])
    print("Planner passed (within 10%):", summary["planner_passed"])
    print("Mean percentage error:", acc["mean_percentage_error"])
    print("MAE per nutrient:", acc["mae"])
    print("Allergy/diet compliance rate:", summary["compliance_rate"])
    print("Structure valid:", summary["structure_valid"],
          "of", summary["generated"])
    print("Seconds per plan: mean", summary["mean_seconds"],
          "| max", summary["max_seconds"])


if __name__ == "__main__":
    all_profiles = load_profiles()
    all_rows = run_evalu
    ation(all_profiles)
    run_summary = summarize_run(all_rows)
    print_report(all_rows, run_summary)
    save_results(all_rows, run_summary)