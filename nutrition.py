import pandas as pd

def load_nutrition_data():#loads whole database
    df = pd.read_csv("data/clean/nutrition_clean.csv")
    return df

def get_food_names():#gets the list of the food names
    df = load_nutrition_data()
    return df["food"].tolist()

def get_food(name):#searches the food with its name
    df = load_nutrition_data()
    exact = df[df["food"].str.lower() == name.lower()]
    if not exact.empty:
        return exact.iloc[0].to_dict()
    return None

def search_food(keyword):#searches the food with its keyword
    df = load_nutrition_data()
    matches = df[df["food"].str.contains(keyword, case=False, na=False)]
    return matches