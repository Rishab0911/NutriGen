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


FEW_SHOT_EXAMPLE = """Here is an example of the format to follow.

Example request:
- Total calories: 1750 kcal
- Total protein: 80 g
- Total carbs: 220 g
- Total fat: 60 g
Diet type: Vegan
Allergies to strictly avoid: soy
Preferences: high fiber

Example response:
Breakfast: Oats with chia seeds, berries and almond butter (~400 kcal | P 14g, C 60g, F 12g)
Lunch: Chickpea and quinoa bowl with spinach and lemon-tahini dressing (~500 kcal | P 24g, C 65g, F 16g)
Snack: Roasted makhana with a handful of almonds (~250 kcal | P 8g, C 25g, F 14g)
Dinner: Red lentil dal with brown rice and sauteed vegetables (~600 kcal | P 34g, C 70g, F 18g)
Daily totals: 1750 kcal | P 80g, C 220g, F 60g
"""
def build_meal_prompt(calories, protein, carbs, fat, diet, allergies=None, preferences=None):
    allergies = allergies or []
    preferences = preferences or []

    prompt = f"""{FEW_SHOT_EXAMPLE}
Now create a one-day meal plan for this request, using exactly the same format as the example:
- Total calories: {calories} kcal
- Total protein: {protein} g
- Total carbs: {carbs} g
- Total fat: {fat} g
Diet type: {diet}
Allergies to strictly avoid: {', '.join(allergies) if allergies else 'None'}
Preferences: {', '.join(preferences) if preferences else 'None'}

The plan must include breakfast, lunch, snack and dinner, and end with daily totals.
"""
    return prompt