import pandas as pd

FOUNDATION = r"C:\Users\ankit\Downloads\FoodData_Central_foundation_food_csv_2026-04-30\FoodData_Central_foundation_food_csv_2026-04-30"
SR_LEGACY = r"C:\Users\ankit\Downloads\FoodData_Central_sr_legacy_food_csv_2018-04\FoodData_Central_sr_legacy_food_csv_2018-04"

NUTRIENTS = {1008: "calories", 1003: "protein", 1004: "fat", 1005: "carbs"}

def extract(folder, id_file, id_col):
    # Sirf asli foods ke fdc_id (foundation_food.csv ya sr_legacy_food.csv se)
    ids = pd.read_csv(f"{folder}\\{id_file}", usecols=[id_col])
    ids = set(ids[id_col])

    food = pd.read_csv(f"{folder}\\food.csv", usecols=["fdc_id", "description"])
    food = food[food["fdc_id"].isin(ids)]

    fn = pd.read_csv(f"{folder}\\food_nutrient.csv", usecols=["fdc_id", "nutrient_id", "amount"])
    fn = fn[fn["fdc_id"].isin(ids) & fn["nutrient_id"].isin(NUTRIENTS)]
    fn["nutrient"] = fn["nutrient_id"].map(NUTRIENTS)

    table = fn.pivot_table(index="fdc_id", columns="nutrient", values="amount").reset_index()
    result = food.merge(table, on="fdc_id", how="left")
    return result

foundation = extract(FOUNDATION, "foundation_food.csv", "fdc_id")
sr_legacy = extract(SR_LEGACY, "sr_legacy_food.csv", "fdc_id")

print("Foundation foods:", len(foundation))
print("SR Legacy foods:", len(sr_legacy))

foundation.to_csv("data/raw/foundation_nutrition.csv", index=False)
sr_legacy.to_csv("data/raw/sr_legacy_nutrition.csv", index=False)
print("Saved both files.")