from llm import send_prompt_json
from prompts import SYSTEM_PROMPT, get_keywords, build_nutrition_context, build_grounded_prompt

profile = {
    "calories": 2000, "protein": 110, "carbs": 230, "fat": 65,
    "diet": "Non-Vegetarian", "allergies": ["Peanuts"], "preferences": ["High Protein"],
}

# Step A: look up real foods in our USDA database
context = build_nutrition_context(get_keywords(profile))
print(context)
print("-----")

# Step B: put those foods in the prompt and ask Gemini
prompt = build_grounded_prompt(profile, context)
plan = send_prompt_json(prompt, system_prompt=SYSTEM_PROMPT)
print(plan)