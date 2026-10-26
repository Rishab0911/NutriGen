from llm import send_prompt
from prompts import SYSTEM_PROMPT, build_meal_prompt

meal_prompt = build_meal_prompt(
    calories=2200,
    protein=130,
    carbs=240,
    fat=70,
    diet="Vegetarian",
    allergies=["milk"],
    preferences=["high protein"]
)

response = send_prompt(meal_prompt, system_prompt=SYSTEM_PROMPT)
print(response)