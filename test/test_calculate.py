from nutrition import calculate_item, get_food

FOOD = "Hummus, commercial"


def test_100g_matches_database():
    base = get_food(FOOD)
    result = calculate_item(FOOD, 100)
    assert result["calories"] == round(base["calories"], 1)
    assert result["fat"] == round(base["fat"], 1)


def test_scaling_doubles_at_200g():
    one = calculate_item(FOOD, 100)
    two = calculate_item(FOOD, 200)
    assert two["calories"] == round(one["calories"] * 2, 1)


def test_zero_grams_gives_zeros():
    result = calculate_item(FOOD, 0)
    assert result["calories"] == 0
    assert result["protein"] == 0


def test_messy_name_still_matches():
    result = calculate_item("  HUMMUS,commercial ", 100)
    assert result is not None
    assert result["food"] == FOOD


def test_unknown_food_returns_none():
    assert calculate_item("not a real food", 100) is None


def test_invalid_grams_return_none():
    assert calculate_item(FOOD, -5) is None
    assert calculate_item(FOOD, "abc") is None
    assert calculate_item(FOOD, None) is None

from planner import check_plan


def _fake_result(calories_pct, not_found=None):
    return {
        "not_found": not_found or [],
        "comparison": {
            "calories": {"target": 2000, "actual": 2000, "difference": 0,
                         "percent_error": calories_pct},
            "protein": {"target": 110, "actual": 110, "difference": 0,
                        "percent_error": 0},
        },
    }


def test_check_plan_good_plan_has_no_problems():
    assert check_plan(_fake_result(5)) == []


def test_check_plan_flags_too_high():
    problems = check_plan(_fake_result(26))
    assert len(problems) == 1
    assert "calories" in problems[0] and "too high" in problems[0]


def test_check_plan_flags_too_low():
    problems = check_plan(_fake_result(-30))
    assert len(problems) == 1
    assert "too low" in problems[0]


def test_check_plan_flags_unknown_food():
    problems = check_plan(_fake_result(0, not_found=["mystery food"]))
    assert len(problems) == 1
    assert "mystery food" in problems[0]