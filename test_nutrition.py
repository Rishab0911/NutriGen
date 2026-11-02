from nutrition import load_nutrition_data, get_food_names, get_food, search_food
df = load_nutrition_data()

print("Total foods:", len(df))
print()
print(df.head())
print()
print(df.dtypes)
names = get_food_names()
print()
print("all food names:", len(names))
print("First 5:", names[:5])

print()
result = get_food("Hummus, commercial")
print("Exact match test:", result)

result2 = get_food("this food does not exist")
print("No match test:", result2)

print()
results = search_food("chicken")
print("Search 'chicken' results:", len(results))
print(results[["food", "calories"]].head(10))

