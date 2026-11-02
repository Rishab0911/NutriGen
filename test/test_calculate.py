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

def test_meal_rows_skip_unknown_meals():
    from planner import _meal_rows
    plan = {"meals": [{"meal": "Breakfast"}, {"meal": "Brunch"}]}
    slots = [(0, 0), (1, 0)]
    rows = _meal_rows(plan, slots, [0.5, 0.5], 2000)
    assert len(rows) == 1

def test_adjust_grams_caps_big_items():
    from planner import adjust_grams, MAX_GRAMS
    plan = {"meals": [{"meal": "Lunch", "dish": "x",
                       "items": [{"food": FOOD, "grams": 600}]}]}
    profile = {"calories": 2000, "protein": 110,
               "carbs": 230, "fat": 65}
    new = adjust_grams(plan, profile)
    grams = new["meals"][0]["items"][0]["grams"]
    assert grams <= MAX_GRAMS

def test_fat_sources_are_offered():
    from prompts import get_keywords
    words = get_keywords({"diet": "Vegetarian"})
    assert "oil, olive" in words
    assert "avocados" in words

from datetime import datetime, timedelta
from proactive import UserState, state_from_profile, detect_triggers


def test_state_from_profile_copies_targets():
    state = state_from_profile("u1", {"calories": 2000, "protein": 110,
                                      "diet": "Vegetarian",
                                      "allergies": ["Nuts"]})
    assert state.calorie_target == 2000
    assert state.allergies == ["Nuts"]
    assert state.last_meal_time is None


def test_log_meal_updates_totals_and_remaining():
    state = UserState("u1", 2000, 110)
    state.log_meal(500, 30)
    state.log_meal(300, 20)
    assert state.calories_logged == 800
    assert state.calories_remaining() == 1200
    assert state.protein_remaining() == 60


def test_hours_since_last_meal():
    state = UserState("u1", 2000, 110)
    assert state.hours_since_last_meal() is None
    start = datetime(2026, 11, 2, 8, 0)
    state.log_meal(400, 20, when=start)
    assert state.hours_since_last_meal(now=start + timedelta(hours=5)) == 5


def test_reset_day_keeps_notification_history():
    state = UserState("u1", 2000, 110)
    state.log_meal(400, 20)
    state.last_notified["long_gap"] = datetime(2026, 11, 2, 9, 0)
    state.reset_day()
    assert state.calories_logged == 0
    assert state.last_meal_time is None
    assert "long_gap" in state.last_notified


def _user_state(calories=0, protein=0, last_meal=None):
    state = UserState("u1", 2000, 100)
    state.calories_logged = calories
    state.protein_logged = protein
    state.last_meal_time = last_meal
    return state


def test_trigger_long_gap():
    state = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 8, 0))
    now = datetime(2026, 11, 2, 14, 0)
    assert detect_triggers(state, now=now) == ["long_gap"]


def test_no_trigger_when_gap_is_short():
    state = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 10, 0))
    now = datetime(2026, 11, 2, 14, 0)
    assert detect_triggers(state, now=now) == []


def test_trigger_no_meal_yet_only_after_11am():
    noon = datetime(2026, 11, 2, 12, 0)
    nine = datetime(2026, 11, 2, 9, 0)
    assert detect_triggers(_user_state(), now=noon) == ["no_meal_yet"]
    assert detect_triggers(_user_state(), now=nine) == []


def test_no_triggers_at_night():
    late = datetime(2026, 11, 2, 23, 0)
    assert detect_triggers(_user_state(), now=late) == []


def test_evening_low_calories_and_protein():
    state = _user_state(500, 20, last_meal=datetime(2026, 11, 2, 18, 0))
    now = datetime(2026, 11, 2, 19, 0)
    assert detect_triggers(state, now=now) == ["low_calories", "low_protein"]


def test_trigger_over_calories():
    state = _user_state(2300, 90, last_meal=datetime(2026, 11, 2, 13, 0))
    now = datetime(2026, 11, 2, 14, 0)
    assert detect_triggers(state, now=now) == ["over_calories"]


from proactive import RULES, decide_actions, top_action


def test_every_trigger_has_a_rule():
    assert set(RULES) == {"no_meal_yet", "long_gap", "over_calories",
                          "low_calories", "low_protein"}


def test_decide_actions_long_gap():
    state = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 8, 0))
    now = datetime(2026, 11, 2, 14, 0)
    actions = decide_actions(["long_gap"], state, now=now)
    assert actions[0]["action"] == "remind_meal"
    assert "6.0 hours" in actions[0]["message"]


def test_decide_actions_sorted_by_priority():
    state = _user_state(500, 20, last_meal=datetime(2026, 11, 2, 8, 0))
    now = datetime(2026, 11, 2, 19, 0)
    actions = decide_actions(["low_protein", "long_gap"], state, now=now)
    assert [a["trigger"] for a in actions] == ["long_gap", "low_protein"]


def test_decide_actions_skips_unknown_trigger():
    state = _user_state()
    assert decide_actions(["made_up"], state) == []


def test_over_calories_message_shows_amount():
    state = _user_state(2300, 90, last_meal=datetime(2026, 11, 2, 13, 0))
    now = datetime(2026, 11, 2, 14, 0)
    actions = decide_actions(["over_calories"], state, now=now)
    assert "300" in actions[0]["message"]


def test_top_action_returns_first_or_none():
    assert top_action([]) is None
    assert top_action([{"trigger": "a"}, {"trigger": "b"}]) == {"trigger": "a"}

from proactive import run_check, make_job, make_scheduler


def test_run_check_returns_top_action():
    state = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 8, 0))
    action = run_check(state, datetime(2026, 11, 2, 14, 0))
    assert action["trigger"] == "long_gap"


def test_run_check_returns_none_when_nothing_to_do():
    state = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 10, 0))
    assert run_check(state, datetime(2026, 11, 2, 14, 0)) is None


def test_job_notifies_only_users_with_an_action():
    needs = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 8, 0))
    fine = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 10, 0))
    sent = []
    job = make_job([needs, fine], lambda s, a: sent.append((s, a)),
                   clock=lambda: datetime(2026, 11, 2, 14, 0))
    job()
    assert len(sent) == 1
    assert sent[0][0] is needs
    assert sent[0][1]["trigger"] == "long_gap"


def test_scheduler_registers_one_job_and_runs_it():
    state = _user_state(800, 40, last_meal=datetime(2026, 11, 2, 8, 0))
    sent = []
    scheduler = make_scheduler([state], lambda s, a: sent.append(a),
                               minutes=30,
                               clock=lambda: datetime(2026, 11, 2, 14, 0))
    assert len(scheduler.get_jobs()) == 1
    scheduler.run_all()
    assert len(sent) == 1