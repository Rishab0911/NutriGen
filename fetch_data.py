import os
import json
import time
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("USDA_API_KEY")
URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

print("Key Found:", API_KEY is not None)

FOODS = [
    "chicken breast", "egg", "fish", "salmon", "tuna", "shrimp", "paneer", "tofu",
    "lentils", "chickpeas", "kidney beans", "black beans", "peas", "soybeans",
    "rice", "wheat flour", "oats", "bread", "pasta", "quinoa", "corn", "barley",
    "milk", "yogurt", "cheese", "butter", "cottage cheese",
    "potato", "sweet potato", "spinach", "tomato", "onion", "carrot", "cauliflower",
    "broccoli", "cabbage", "cucumber", "capsicum", "mushroom", "okra", "pumpkin",
    "banana", "apple", "orange", "mango", "grapes", "papaya", "watermelon",
    "almonds", "peanuts", "walnuts", "cashews", "sesame seeds", "olive oil",
]

os.makedirs("data/raw", exist_ok=True)
all_results = {}

for food in FOODS:
    params = {
        "query": food,
        "dataType": "Foundation,SR Legacy",
        "pageSize": 5,
        "api_key": API_KEY,
    }
    r = requests.get(URL, params=params, timeout=30)
    r.raise_for_status()
    all_results[food] = r.json().get("foods", [])
    print(f"{food}: {len(all_results[food])} results")
    time.sleep(0.5)

with open("data/raw/usda_raw.json", "w") as f:
    json.dump(all_results, f, indent=2)

print("Done! Data saved.")