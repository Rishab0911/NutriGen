from llm import send_prompt
from prompts import SYSTEM_PROMPT, build_meal_prompt

meal_prompt = build_meal_prompt(
    calories=2000,
    protein=120,
    carbs=220,
    fat=60,
    diet=" Non -Vegetarian",
    allergies=["peanuts"],
    preferences=["high protein"]
)

print("--- Prompt ---")
print(meal_prompt)
print("--- Response ---")

response = send_prompt(meal_prompt, system_prompt=SYSTEM_PROMPT)
print(response)