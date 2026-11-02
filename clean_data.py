import os
import pandas as pd

# Teeno source load karo
foundation = pd.read_csv("data/raw/foundation_nutrition.csv")
sr_legacy = pd.read_csv("data/raw/sr_legacy_nutrition.csv")
branded = pd.read_csv("data/raw/paper_nutrition.csv")

foundation = foundation.rename(columns={"description": "food"})
sr_legacy = sr_legacy.rename(columns={"description": "food"})
branded = branded.rename(columns={"description": "food"})[["food", "calories", "protein", "fat", "carbs"]]

foundation = foundation[["food", "calories", "protein", "fat", "carbs"]]
sr_legacy = sr_legacy[["food", "calories", "protein", "fat", "carbs"]]

df = pd.concat([foundation, sr_legacy, branded], ignore_index=True)
print("Combine karne ke baad total rows:", len(df))

before = len(df)

# Rule 1: chaaron nutrients me se koi bhi missing na ho
df = df.dropna(subset=["calories", "protein", "fat", "carbs"])

# Rule 2: per 100g me protein/fat/carbs 100g se zyada nahi ho sakte
df = df[(df["protein"] <= 100) & (df["fat"] <= 100) & (df["carbs"] <= 100)]

# Rule 3: calories 0-900 ke beech honi chahiye (per 100g ka realistic range)
df = df[(df["calories"] >= 0) & (df["calories"] <= 900)]

# Duplicate food names hata do (pehli baar wali rakho)
df = df.drop_duplicates(subset=["food"], keep="first")

df["quantity"] = 100
df["unit"] = "g"
df = df[["food", "quantity", "unit", "calories", "protein", "carbs", "fat"]]

print("Cleaning ke baad rows:", len(df))

os.makedirs("data/clean", exist_ok=True)
df.to_csv("data/clean/nutrition_clean.csv", index=False)
print("Saved to data/clean/nutrition_clean.csv")