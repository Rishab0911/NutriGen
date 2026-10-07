SYSTEM_PROMPT = """You are NutriGen, a personalized meal planning assistant.

Your job is to generate practical, realistic meal plans based on a user's:
- Daily calorie target
- Macronutrient targets (protein, carbs, fat)
- Dietary restrictions and allergies
- Food preferences

Rules you must always follow:
1. Only suggest meals that respect the user's allergies and dietary restrictions. This is non-negotiable.
2. Keep meals realistic and practical to prepare at home.
3. Use familiar dish names (e.g. "vegetable stir fry") rather than listing raw ingredients.
4. Stay close to the user's calorie and macro targets.
5. Be concise and avoid unnecessary explanation unless asked.
"""

def build_meal_prompt(calories, protein, carbs, fat, diet, allergies=None, preferences=None):
    allergies = allergies or []
    preferences = preferences or []

    prompt = f"""Create a one-day meal plan with:
- Total calories: {calories} kcal
- Total protein: {protein} g
- Total carbs: {carbs} g
- Total fat: {fat} g

Diet type: {diet}
Allergies to strictly avoid: {', '.join(allergies) if allergies else 'None'}
Preferences: {', '.join(preferences) if preferences else 'None'}

The plan must include breakfast, lunch, dinner, and one snack.
For each meal, give the name of the dish and its approximate calories.
At the end, give the total calories, protein, carbs, and fat for the full day.
"""
    return prompt