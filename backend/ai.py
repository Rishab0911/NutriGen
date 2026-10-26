
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
