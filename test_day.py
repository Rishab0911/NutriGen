from nutrition import get_food_names, calculate_day

names = get_food_names()
a, b, c = names[0], names[1], names[2]

plan = {
    "meals": [
        {"meal": "Breakfast", "dish": "Test breakfast",
         "items": [{"food": a, "grams": 100}, {"food": b, "grams": 50}]},
        {"meal": "Lunch", "dish": "Test lunch",
         "items": [{"food": c, "grams": 200}, {"food": "not a real food", "grams": 80}]},
    ]
}
profile = {"calories": 2000, "protein": 110, "carbs": 230, "fat": 65}

result = calculate_day(plan, profile)

for m in result["meals"]:
    print(m["meal"], m["totals"], "not found:", m["not_found"])
print()
print("Day totals:", result["day_totals"])
print()
for n, c in result["comparison"].items():
    print(n, c)
print()
print("Not found overall:", result["not_found"])