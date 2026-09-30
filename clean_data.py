import pandas as pd

df = pd.read_csv("data/raw/paper_nutrition.csv")

print("Total rows:", len(df))
print()
print("Missing values per column:")
print(df[["calories", "protein", "fat", "carbs"]].isna().sum())
print()

all_missing = df[["calories", "protein", "fat", "carbs"]].isna().all(axis=1).sum()
print("rows that have all nutrients missing:", all_missing)
print()
print(df[["calories", "protein", "fat", "carbs"]].describe())

before = len(df)

# Rule 1: chaaron nutrients me se koi bhi missing na ho
df = df.dropna(subset=["calories", "protein", "fat", "carbs"])

# Rule 2: per 100g me protein/fat/carbs 100g se zyada nahi ho sakte
df = df[(df["protein"] <= 100) & (df["fat"] <= 100) & (df["carbs"] <= 100)]

# Rule 3: calories 0-900 ke beech honi chahiye (per 100g ka realistic range)
df = df[(df["calories"] >= 0) & (df["calories"] <= 900)]

print("First rows:", before)
print("Rows after cleaning:", len(df))

df = df.rename(columns={"description": "food"})
df["quantity"] = 100
df["unit"] = "g"
df = df[["food", "quantity", "unit", "calories", "protein", "carbs", "fat"]]

df.to_csv("data/clean/nutrition_clean.csv", index=False)
print("Saved to data/clean/nutrition_clean.csv")