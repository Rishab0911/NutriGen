def calculate_calories(weight: float, goal: str):
    base_calories = weight * 30

    if goal == "weight loss":
        return base_calories - 300

    elif goal == "weight gain":
        return base_calories + 300

    else:
        return base_calories