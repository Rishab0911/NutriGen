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

from planner import adjust_grams, offered_names, repair_names


def test_adjust_grams_keeps_structure_and_bounds():
    plan = {"meals": [{"meal": "Lunch", "dish": "x", "items": [
        {"food": FOOD, "grams": 100},
        {"food": "not a real food", "grams": 80},
    ]}]}
    profile = {"calories": 1000, "protein": 50, "carbs": 100, "fat": 40}
    new = adjust_grams(plan, profile)
    items = new["meals"][0]["items"]
    assert len(items) == 2
    assert items[1]["grams"] == 80           # unknown food is left alone
    assert 45 <= items[0]["grams"] <= 205    # within 0.5x to 2x, plus rounding
    assert plan["meals"][0]["items"][0]["grams"] == 100  # original untouched


def test_adjust_grams_with_no_known_foods_returns_plan():
    plan = {"meals": [{"meal": "Lunch", "dish": "x", "items": [
        {"food": "not a real food", "grams": 80},
    ]}]}
    profile = {"calories": 1000, "protein": 50, "carbs": 100, "fat": 40}
    assert adjust_grams(plan, profile) == plan


def test_offered_names_reads_context_lines():
    context = (
        "- Rice, brown (x) (per 100 g): 100 kcal, protein 1 g, carbs 2 g, fat 3 g\n"
        "- Broccoli, raw (per 100 g): 31.0 kcal, protein 1 g, carbs 2 g, fat 3 g"
    )
    assert offered_names(context) == ["Rice, brown (x)", "Broccoli, raw"]


def test_repair_names_fixes_close_name_and_leaves_others():
    names = [FOOD, "Rice, brown, parboiled, dry, UNCLE BEN'S"]
    plan = {"meals": [{"meal": "Lunch", "dish": "x", "items": [
        {"food": "Rice, brown, long-grain, raw", "grams": 80},
        {"food": "Mystery stuff", "grams": 50},
    ]}]}
    new, fixed = repair_names(plan, names)
    items = new["meals"][0]["items"]
    assert items[0]["food"] == "Rice, brown, parboiled, dry, UNCLE BEN'S"
    assert items[1]["food"] == "Mystery stuff"
    assert len(fixed) == 1

from nutrition import restricted_words, find_violations
from prompts import build_nutrition_context


def test_restricted_words_peanut_allergy():
    words = restricted_words({"allergies": ["Peanuts"], "diet": "Non-Vegetarian"})
    assert "peanut" in words
    assert "chicken" not in words


def test_restricted_words_no_nuts_covers_all_nuts():
    words = restricted_words({"allergies": ["no nuts"], "diet": "Vegetarian"})
    assert "peanut" in words and "almond" in words and "cashew" in words


def test_restricted_words_vegan_excludes_animal_foods():
    words = restricted_words({"allergies": [], "diet": "Vegan"})
    for w in ["chicken", "milk", "egg", "salmon", "honey"]:
        assert w in words


def test_restricted_words_unknown_allergy_uses_its_own_name():
    words = restricted_words({"allergies": ["Mustard"], "diet": "Non-Vegetarian"})
    assert "mustard" in words


def test_find_violations_checks_foods_and_dish_names():
    result = {"meals": [{"meal": "Lunch", "dish": "Peanut noodle bowl",
                         "items": [{"food": FOOD}],
                         "not_found": ["Peanut butter"]}]}
    assert find_violations(result, ["peanut"]) == [
        "Peanut noodle bowl", "Peanut butter"]
    assert find_violations(result, []) == []


def test_allergen_foods_are_removed_from_prompt_context():
    words = restricted_words({"allergies": ["eggs"], "diet": "Vegetarian"})
    assert build_nutrition_context(["egg, whole"], exclude_words=words) == ""
    words = restricted_words({"allergies": ["no nuts"], "diet": "Vegetarian"})
    context = build_nutrition_context(["almonds"], exclude_words=words)
    assert "almond" not in context.lower()

def test_protein_preference_in_keywords_and_prompt():
    from prompts import get_keywords, build_grounded_prompt
    profile = {
        "calories": 2000, "protein": 110, "carbs": 230,
        "fat": 65, "diet": "Vegetarian", "allergies": [],
        "preferences": [], "protein_preference": ["Lentils"],
    }
    assert get_keywords(profile)[0] == "Lentils"
    prompt = build_grounded_prompt(profile, "- x")
    assert "Preferred protein foods: Lentils" in prompt
    del profile["protein_preference"]
    plain = build_grounded_prompt(profile, "- x")
    assert "Preferred protein" not in plain