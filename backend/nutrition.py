def calculate_nutrition(
    age: int,
    height: float,
    gender: str,
    weight: float,
    activity: float,
    goal: str,
    calories: float | None,
    preferences: list[str]
):
    # BMR using Mifflin-St Jeor
    if gender == "Male":
        gender_adjustment = 5
    else:
        gender_adjustment = -161

    bmr = (
        10 * weight
        + 6.25 * height
        - 5 * age
        + gender_adjustment
    )

    # TDEE
    tdee = bmr * activity

    # Goal adjustment
    goal_adjustment = {
        "Weight Loss": -500,
        "Weight Gain": 400,
        "Maintain Weight": 0
    }

    adjustment = goal_adjustment[goal]

    # Calorie target
    if calories is not None:
        daily_calories = calories
    else:
        daily_calories = round(
            (tdee + adjustment) / 50
        ) * 50

        minimum_calories = (
            1500 if gender == "Male"
            else 1200
        )

        daily_calories = max(
            daily_calories,
            minimum_calories
        )

    # Protein
    protein_multiplier = (
        1.2 if goal == "Maintain Weight"
        else 1.6
    )

    protein = weight * protein_multiplier

    if "High Protein" in preferences:
        protein += 0.3 * weight

    protein = round(protein)

    # Carbs and fat
    if "Low Carb" in preferences:
        carbs = round(
            daily_calories * 0.30 / 4
        )

        fat = round(
            (
                daily_calories
                - protein * 4
                - carbs * 4
            ) / 9
        )

    else:
        fat_percentage = (
            0.22
            if "Low Fat" in preferences
            else 0.28
        )

        fat = round(
            daily_calories
            * fat_percentage
            / 9
        )

        carbs = round(
            (
                daily_calories
                - protein * 4
                - fat * 9
            ) / 4
        )

    carbs = max(carbs, 50)
    fat = max(fat, 20)

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "daily_calories": daily_calories,
        "macros": {
            "protein": protein,
            "carbs": carbs,
            "fat": fat
        }
    }