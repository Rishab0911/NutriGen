from llm import send_prompt_json
from prompts import SYSTEM_PROMPT, get_keywords, build_nutrition_context, build_grounded_prompt
from nutrition import calculate_day

profile = {
    "calories": 2000, "protein": 110, "carbs": 230, "fat": 65,
    "diet": "Non-Vegetarian", "allergies": ["Peanuts"], "preferences": ["High Protein"],
}

# 1. Ask Gemini for foods + grams (grounded in the database)
context = build_nutrition_context(get_keywords(profile))
prompt = build_grounded_prompt(profile, context)
plan = send_prompt_json(prompt, system_prompt=SYSTEM_PROMPT)

# 2. Calculate the REAL numbers from the database
result = calculate_day(plan, profile)

# 3. Print a readable report
for meal in result["meals"]:
    print(f"\n{meal['meal']}: {meal['dish']}")
    for item in meal["items"]:
        print(f"   {item['grams']:>6.0f} g  {item['food']}  ->  {item['calories']} kcal")
    print("   Meal total:", meal["totals"])
    if meal["not_found"]:
        print("   NOT FOUND:", meal["not_found"])

print("\nDay totals:", result["day_totals"])
print()
for n, c in result["comparison"].items():
    print(f"{n:9} target {c['target']:>6}  actual {c['actual']:>7}  "
          f"diff {c['difference']:>7}  ({c['percent_error']}%)")

print("\nNot found overall:", result["not_found"])