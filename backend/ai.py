
def prepare_ai_requirements(profile: dict, nutrition: dict):
    """
    Prepare the user's profile and nutrition targets
    for the AI meal-plan generator.
    """

    ai_requirements = {
        "user_profile": {
            "age": profile["age"],
            "height": profile["height"],
            "gender": profile["gender"],
            "weight": profile["weight"],
            "target_weight": profile["target"],
            "goal": profile["goal"],
            "diet": profile["diet"],
            "activity": profile["activity"],
            "preferences": profile["preferences"],
            "allergies": profile["allergies"],
            "restrictions": profile["restrictions"],
            "foods_to_include": profile["include"],
            "foods_to_avoid": profile["avoid"],
            "other_preference": profile["otherPreference"],
            "other_allergy": profile["otherAllergy"]
        },
        "nutrition_targets": {
            "bmr": nutrition["bmr"],
            "tdee": nutrition["tdee"],
            "daily_calories": nutrition["daily_calories"],
            "macros": nutrition["macros"]
        }
    }

    # Temporary test response until Gemini is connected.
    return {
        "status": "prepared",
        "message": "Nutrition requirements prepared for AI",
        "requirements": ai_requirements
    }


import json


def parse_ai_response(response_text: str):
    """
    Convert an AI response from JSON text
    into structured Python data.
    """

    try:
        parsed_response = json.loads(response_text)
    except json.JSONDecodeError as error:
        raise ValueError("AI returned invalid JSON") from error

    if not isinstance(parsed_response, dict):
        raise ValueError("AI response must be a JSON object")

    meal_plan = parsed_response.get("meal_plan")

    if not isinstance(meal_plan, list):
        raise ValueError("AI response must contain a meal_plan list")

    for meal in meal_plan:
        if not isinstance(meal, dict):
            raise ValueError("Each meal must be a JSON object")

        if not all(key in meal for key in ("meal", "food", "calories")):
            raise ValueError(
                "Each meal must contain meal, food and calories"
            )

    return parsed_response

import json


def generate_mock_ai_response(requirements: dict) -> str:
    """
    Simulate an AI service returning a JSON meal plan.
    Replace this function with the real Gemini call later.
    """

    response = {
        "meal_plan": [
            {
                "meal": "Breakfast",
                "food": "Vegetable oats",
                "calories": 400
            },
            {
                "meal": "Lunch",
                "food": "Rice, dal and vegetables",
                "calories": 600
            },
            {
                "meal": "Dinner",
                "food": "Chapati with mixed vegetables",
                "calories": 550
            }
        ]
    }

    return json.dumps(response)


def get_fallback_meal_plan():
    """
    Return a basic backup meal plan if AI generation fails.
    """

    return {
        "meal_plan": [
            {
                "meal": "Breakfast",
                "food": "Oats with milk",
                "calories": 400
            },
            {
                "meal": "Lunch",
                "food": "Rice, dal and vegetables",
                "calories": 600
            },
            {
                "meal": "Dinner",
                "food": "Chapati with vegetables",
                "calories": 550
            }
        ]
    }
