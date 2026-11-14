import time

from jsonschema import Draft202012Validator

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