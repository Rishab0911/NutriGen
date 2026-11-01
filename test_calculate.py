from nutrition import get_food_names, get_food, calculate_item

name = get_food_names()[0]
base = get_food(name)
print("Food:", name)
print("Per 100 g:", base["calories"], base["protein"], base["carbs"], base["fat"])
print("100 g:", calculate_item(name, 100))
print("200 g:", calculate_item(name, 200))
print("Messy name:", calculate_item("  " + name.upper() + " ", 50))
print("Not found:", calculate_item("not a real food", 100))
print("Negative:", calculate_item(name, -5))
print("Bad grams:", calculate_item(name, "abc"))