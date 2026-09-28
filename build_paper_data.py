import pandas as pd

DATA = r"E:\Aahana\usda_data\FoodData_Central_branded_food_csv_2025-12-18"

foods = pd.read_csv("data/raw/paper_foods.csv")
ids = set(foods["fdc_id"])
NUTRIENTS = {1008: "calories", 1003: "protein", 1004: "fat", 1005: "carbs"}

parts = []
for chunk in pd.read_csv(DATA + r"\food_nutrient.csv",
                         usecols=["fdc_id", "nutrient_id", "amount"],
                         chunksize=1_000_000):
    keep = chunk[chunk["fdc_id"].isin(ids) & chunk["nutrient_id"].isin(NUTRIENTS)]
    parts.append(keep)
    print("chunk done")

nut = pd.concat(parts)
nut["nutrient"] = nut["nutrient_id"].map(NUTRIENTS)
table = nut.pivot_table(index="fdc_id", columns="nutrient", values="amount").reset_index()

result = foods.merge(table, on="fdc_id", how="left")
result.to_csv("data/raw/paper_nutrition.csv", index=False)

print(result.head(10))
print("Missing values:")
print(result[["calories", "protein", "fat", "carbs"]].isna().sum())