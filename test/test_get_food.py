import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from nutrition import get_food, search_food


def test_get_food_exact_match():
    result = get_food("Hummus, commercial")
    assert result is not None
    assert result["calories"] == 229.0
    assert result["protein"] == 7.35


def test_get_food_no_match():
    result = get_food("this food does not exist")
    assert result is None


def test_search_food_returns_results():
    results = search_food("chicken")
    assert len(results) > 0


def test_search_food_case_insensitive():
    results_lower = search_food("chicken")
    results_upper = search_food("CHICKEN")
    assert len(results_lower) == len(results_upper)


def test_search_food_no_match():
    results = search_food("this food does not exist")
    assert len(results) == 0