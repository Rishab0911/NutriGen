from nutrition import search_food, find_matches

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
JSON_FORMAT = """Respond ONLY with valid JSON in exactly this structure:
{
  "meals": [
    {"meal": "Breakfast", "dish": "dish name", "calories": 400, "protein": 14, "carbs": 60, "fat": 12},
    {"meal": "Lunch", "dish": "dish name", "calories": 500, "protein": 24, "carbs": 65, "fat": 16},
    {"meal": "Snack", "dish": "dish name", "calories": 250, "protein": 8, "carbs": 25, "fat": 14},
    {"meal": "Dinner", "dish": "dish name", "calories": 600, "protein": 34, "carbs": 70, "fat": 18}
  ],
  "totals": {"calories": 1750, "protein": 80, "carbs": 220, "fat": 60}
}
All numbers must be plain numbers (no units, no text)."""


def build_json_meal_prompt(calories, protein, carbs, fat, diet, allergies=None, preferences=None):
    allergies = allergies or []
    preferences = preferences or []

    request = f"""Create a one-day meal plan for this request:
- Total calories: {calories} kcal
- Total protein: {protein} g
- Total carbs: {carbs} g
- Total fat: {fat} g
Diet type: {diet}
Allergies to strictly avoid: {', '.join(allergies) if allergies else 'None'}
Preferences: {', '.join(preferences) if preferences else 'None'}

The plan must include breakfast, lunch, snack and dinner.
"""
    return request + "\n" + JSON_FORMAT


# Words that mark foods we do not want to offer (restaurant dishes, baby food, etc.)
ALWAYS_EXCLUDE = ["restaurant", "babyfood", "fast foods", "usda commodity",
                  "giblets", "skin only", "rotisserie", "candies", "snacks", "salad",
                  "bologna", "souffle", "mayonnaise", "tofu yogurt", "fat, turkey",
                  "crabapples", "rose-apples", "sun-dried", "flour",
                  "separable fat", "gravy", "pastrami", "denny's", "spaghetti",
                  "sugar-apples", "honey roasted", "whole, dried"]

# Everyday foods we search for in the database
BASE_KEYWORDS = ["oats", "rice, brown", "lentils", "chickpeas", "beans, black",
                 "quinoa", "tofu", "potatoes", "spinach", "broccoli", "tomatoes",
                 "bananas", "apples", "almonds", "bread, whole-wheat"]
VEG_KEYWORDS = ["yogurt", "milk, whole", "cheese, cottage", "egg, whole"]
NONVEG_KEYWORDS = ["chicken, broiler", "salmon", "turkey", "shrimp", "tuna"]


def get_keywords(profile):
    # Pick which foods to search for, based on the user's diet
    keywords = list(BASE_KEYWORDS)
    keywords += FAT_KEYWORDS
    diet = profile.get("diet", "")
    if diet in ("Vegetarian", "Non-Vegetarian"):
        keywords += VEG_KEYWORDS
    if diet == "Non-Vegetarian":
        keywords += NONVEG_KEYWORDS

    wanted = profile.get("protein_preference") or []
    if isinstance(wanted, str):
        wanted = [wanted]
    keywords = list(wanted) + keywords
    return list(dict.fromkeys(keywords))


def build_nutrition_context(keywords, exclude_words=None, per_keyword=3):
    # Turns database rows into text lines that we can put inside the prompt
    exclude_words = (exclude_words or []) + ALWAYS_EXCLUDE
    lines = []
    seen = set()
    for keyword in keywords:
        matches = search_food(keyword)
        if matches.empty:
            continue
        keep = matches[~matches["food"].apply(lambda name: bool(find_matches(name, exclude_words)))]
        keep = keep.assign(_len=keep["food"].str.len()).sort_values("_len")
        for _, row in keep.head(per_keyword).iterrows():
            if row["food"] in seen:
                continue
            seen.add(row["food"])
            lines.append(
                f"- {row['food']} (per 100 g): {row['calories']} kcal, "
                f"protein {row['protein']} g, carbs {row['carbs']} g, fat {row['fat']} g"
            )
    return "\n".join(lines)


# New JSON format: Gemini gives foods and grams, not calories
JSON_FORMAT_ITEMS = """Respond ONLY with valid JSON in exactly this structure:
{
  "meals": [
    {"meal": "Breakfast", "dish": "dish name", "items": [{"food": "exact food name from the list", "grams": 80}]},
    {"meal": "Lunch", "dish": "dish name", "items": [{"food": "exact food name from the list", "grams": 150}]},
    {"meal": "Snack", "dish": "dish name", "items": [{"food": "exact food name from the list", "grams": 40}]},
    {"meal": "Dinner", "dish": "dish name", "items": [{"food": "exact food name from the list", "grams": 200}]}
  ]
}
"grams" must be a plain number. Do not include calories or totals, they are calculated separately."""


def build_grounded_prompt(profile, nutrition_context, feedback=""):
    allergies = profile.get("allergies", [])
    preferences = profile.get("preferences", [])
    cuisine = profile.get("cuisine", "")

    prompt = f"""Create a one-day meal plan for this request:
- Total calories: {profile['calories']} kcal
- Total protein: {profile['protein']} g
- Total carbs: {profile['carbs']} g
- Total fat: {profile['fat']} g
Diet type: {profile['diet']}
Allergies to strictly avoid: {', '.join(allergies) if allergies else 'None'}
Preferences: {', '.join(preferences) if preferences else 'None'}
"""
    if cuisine:
        prompt += (
            f"Cuisine preference: {cuisine}. "
            f"Use familiar {cuisine} style dish names "
            "where possible.\n")
    wanted = profile.get("protein_preference") or []
    if isinstance(wanted, str):
        wanted = [wanted]
    if wanted:
        prompt += (
            "Preferred protein foods: " + ", ".join(wanted)
            + ". Use them if the diet and allergies allow.\n")


    if "High Protein" in preferences:
        prompt += "Protein is a priority: reach the protein target or slightly exceed it.\n"

    prompt += f"""
The plan must include breakfast, lunch, snack and dinner.

Available foods with nutrition values per 100 g:
{nutrition_context}

Rules:
- Build every meal ONLY from the foods listed above.
- Copy each food name exactly as written in the list.
- Choose the grams for each item so the whole day is close to the calorie, protein, carbs and fat targets (scale the per-100 g values by the grams).
- Use 2 to 4 items per meal.

"""
    prompt += JSON_FORMAT_ITEMS
    if feedback:
        prompt += f"\n\nProblems found in the previous attempt, please fix them:\n{feedback}\n"
    return prompt

FAT_KEYWORDS = [
    "oil, olive", "avocados", "seeds, flax", "seeds, chia",
]