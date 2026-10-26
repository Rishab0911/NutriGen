from llm import send_prompt_json
from prompts import SYSTEM_PROMPT, build_json_meal_prompt

prompt = build_json_meal_prompt(
    calories=2000,
    protein=110,
    carbs=230,
    fat=65,
    diet="Non-Vegetarian",
    allergies=["peanuts"],
    preferences=["high protein"]
)

plan = send_prompt_json(prompt, system_prompt=SYSTEM_PROMPT)

print("Type:", type(plan))
for meal in plan["meals"]:
    print(meal["meal"], "-", meal["dish"], "-", meal["calories"], "kcal")
print("Totals:", plan["totals"])