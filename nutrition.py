import pandas as pd

def load_nutrition_data():
    df = pd.read_csv("data/clean/nutrition_clean.csv")
    return df

def get_food_names():
    df = load_nutrition_data()
    return df["food"].tolist()