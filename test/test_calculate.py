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