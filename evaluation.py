TOLERANCE = 10  # percent, the same limit the planner uses
NUTRIENTS = ["calories", "protein", "carbs", "fat"]


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