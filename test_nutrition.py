from nutrition import load_nutrition_data, get_food_names
df = load_nutrition_data()

print("Total foods:", len(df))
print()
print(df.head())
print()
print(df.dtypes)
names = get_food_names()
print()
print("Kul food names:", len(names))
print("First 5:", names[:5])

