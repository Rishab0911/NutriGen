import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pytest import approx
from evaluation import (absolute_error, percentage_error, mae,
                        evaluate_plan, compliance_rate)


def _result(calories, protein, carbs, fat):
    """A small fake plan result with targets 2000 / 100 / 200 / 60."""
    targets = {"calories": 2000, "protein": 100, "carbs": 200, "fat": 60}
    actuals = {"calories": calories, "protein": protein, "carbs": carbs, "fat": fat}
    return {"comparison": {n: {"target": targets[n], "actual": actuals[n]}
                           for n in targets}}


def test_absolute_error_below_and_above_target():
    assert absolute_error(1850, 2000) == 150
    assert absolute_error(2100, 2000) == 100


def test_percentage_error():
    assert percentage_error(1850, 2000) == approx(7.5)


def test_percentage_error_is_none_when_target_is_zero():
    assert percentage_error(100, 0) is None


def test_mae_is_the_mean_of_the_errors():
    assert mae([100, 200]) == approx(150)


def test_mae_ignores_none_values():
    assert mae([100, None, 200]) == approx(150)


def test_mae_is_none_when_nothing_is_left():
    assert mae([]) is None
    assert mae([None]) is None


def test_evaluate_plan_within_tolerance():
    score = evaluate_plan(_result(1900, 105, 200, 60))
    assert score["within_tolerance"] is True
    assert score["mean_percentage_error"] == approx(2.5)


def test_evaluate_plan_outside_tolerance():
    score = evaluate_plan(_result(1900, 110, 200, 69))
    assert score["within_tolerance"] is False
    assert score["per_nutrient"]["fat"]["percentage_error"] == approx(15.0)


def test_compliance_rate():
    checks = [{"compliant": True}, {"compliant": False}]
    assert compliance_rate(checks) == approx(0.5)
    assert compliance_rate([]) is None