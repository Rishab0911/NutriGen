import re
from functools import lru_cache
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

def find_matches(text, words):
    # Returns the words from the list that appear at the start of a word in the text
    text = text.lower().replace("eggplant", "")
    return [w for w in words if re.search(r"\b" + re.escape(w.lower()), text)]

def _normalize(name):
    """Lowercase, trim, and fix comma/space differences so that
    'Chicken,broilers' matches 'Chicken, broilers'."""
    text = re.sub(r"\s*,\s*", ", ", str(name).strip().lower())
    return re.sub(r"\s+", " ", text)


@lru_cache(maxsize=1)
def _lookup_table():
    """Load the data once and index it by normalized food name."""
    df = load_nutrition_data().copy()
    df["_key"] = df["food"].apply(_normalize)
    df = df.drop_duplicates(subset="_key", keep="first")
    return df.set_index("_key")


def calculate_item(food_name, grams):
    """Scale one food's per-100 g values to `grams`.
    Returns a dict, or None if the food is not found or grams is invalid."""
    try:
        grams = float(grams)
    except (TypeError, ValueError):
        return None
    if grams != grams or grams < 0:  # NaN or negative
        return None

    table = _lookup_table()
    key = _normalize(food_name)
    if key not in table.index:
        return None

    row = table.loc[key]
    factor = grams / 100
    return {
        "food": row["food"],
        "grams": grams,
        "calories": round(float(row["calories"]) * factor, 1),
        "protein": round(float(row["protein"]) * factor, 1),
        "carbs": round(float(row["carbs"]) * factor, 1),
        "fat": round(float(row["fat"]) * factor, 1),
    }
NUTRIENTS = ["calories", "protein", "carbs", "fat"]


def calculate_meal(items):
    """items: [{"food": "...", "grams": 150}, ...]
    Returns totals, per-item details, and any foods not found in the database."""
    totals = {n: 0.0 for n in NUTRIENTS}
    details, not_found = [], []
    for item in items or []:
        food = item.get("food")
        result = calculate_item(food, item.get("grams"))
        if result is None:
            not_found.append(str(food))
            continue
        details.append(result)
        for n in NUTRIENTS:
            totals[n] += result[n]
    return {
        "totals": {n: round(v, 1) for n, v in totals.items()},
        "items": details,
        "not_found": not_found,
    }


def calculate_day(plan, profile):
    """plan: Gemini JSON {"meals": [{"meal", "dish", "items": [...]}, ...]}
    profile: dict with calories, protein, carbs, fat targets.
    Returns real totals from the database and how far they are from the targets."""
    day = {n: 0.0 for n in NUTRIENTS}
    meals_out, not_found = [], []

    for meal in plan.get("meals", []):
        result = calculate_meal(meal.get("items", []))
        meals_out.append({
            "meal": meal.get("meal"),
            "dish": meal.get("dish"),
            **result,
        })
        not_found += result["not_found"]
        for n in NUTRIENTS:
            day[n] += result["totals"][n]

    day = {n: round(v, 1) for n, v in day.items()}

    comparison = {}
    for n in NUTRIENTS:
        target = profile[n]
        diff = round(day[n] - target, 1)
        pct = round(diff / target * 100, 1) if target else None
        comparison[n] = {"target": target, "actual": day[n],
                         "difference": diff, "percent_error": pct}

    return {
        "meals": meals_out,
        "day_totals": day,
        "comparison": comparison,
        "not_found": not_found,
    }

NUT_WORDS = ["almond", "walnut", "cashew", "pecan", "pistachio", "hazelnut",
             "macadamia", "brazil nut", "pine nut", "nuts"]
DAIRY_WORDS = ["milk", "cheese", "yogurt", "yoghurt", "butter", "cream", "whey",
               "casein", "curd", "kefir", "paneer", "ghee"]
EGG_WORDS = ["egg"]
SOY_WORDS = ["soy", "tofu", "tempeh", "edamame", "miso"]
GLUTEN_WORDS = ["wheat", "bread", "barley", "rye", "pasta", "noodle", "oat",
                "cereal", "couscous", "bulgur", "semolina", "flour"]
FISH_WORDS = ["fish", "salmon", "tuna", "cod", "tilapia", "trout", "sardine",
              "anchov", "mackerel", "halibut", "bass", "haddock", "pollock",
              "catfish"]
SHELLFISH_WORDS = ["shrimp", "prawn", "crab", "lobster", "crayfish", "clam",
                   "oyster", "mussel", "scallop"]
SESAME_WORDS = ["sesame", "tahini"]
MEAT_WORDS = ["chicken", "beef", "pork", "lamb", "turkey", "duck", "bacon",
              "ham", "sausage", "veal", "venison", "goat"]

ALLERGEN_WORDS = {
    "peanut": ["peanut"], "peanuts": ["peanut"],
    "nut": ["peanut"] + NUT_WORDS, "nuts": ["peanut"] + NUT_WORDS,
    "tree nut": NUT_WORDS, "tree nuts": NUT_WORDS,
    "dairy": DAIRY_WORDS, "milk": DAIRY_WORDS, "lactose": DAIRY_WORDS,
    "egg": EGG_WORDS, "eggs": EGG_WORDS,
    "soy": SOY_WORDS, "soya": SOY_WORDS,
    "gluten": GLUTEN_WORDS, "wheat": GLUTEN_WORDS,
    "fish": FISH_WORDS, "shellfish": SHELLFISH_WORDS,
    "sesame": SESAME_WORDS,
}
RESTRICTION_WORDS = {
    "no seafood": FISH_WORDS + SHELLFISH_WORDS,
    "no red meat": ["beef", "lamb", "mutton", "veal", "steak", "venison", "goat"],
    "no pork": ["pork", "bacon", "ham", "sausage"],
}

DIET_WORDS = {
    "vegan": MEAT_WORDS + FISH_WORDS + SHELLFISH_WORDS + DAIRY_WORDS
             + EGG_WORDS + ["honey", "gelatin"],
    "vegetarian": MEAT_WORDS + FISH_WORDS + SHELLFISH_WORDS + ["gelatin"],
}


def restricted_words(profile):
    """Words that must not appear in any food or dish name for this user."""
    words = []
    for allergy in profile.get("allergies") or []:
        key = str(allergy).strip().lower()
        if key.startswith("no "):
            key = key[3:].strip()
        if not key or key == "none":
            continue
        words += ALLERGEN_WORDS.get(key, [key, key.rstrip("s")])
    for restriction in profile.get("restrictions") or []:
        words += RESTRICTION_WORDS.get(str(restriction).strip().lower(), [])
    preferences = [str(p).strip().lower() for p in profile.get("preferences") or []]
    if "dairy free" in preferences:
        words += DAIRY_WORDS
    diet = str(profile.get("diet", "")).strip().lower()
    words += DIET_WORDS.get(diet, [])




    return list(dict.fromkeys(w for w in words if w))


def find_violations(result, words):
    """Names in a calculated day (dish names, foods, unknown foods)
    that contain a restricted word."""
    if not words:
        return []
    bad = []
    for meal in result.get("meals", []):
        names = [meal.get("dish")]
        names += [item["food"] for item in meal.get("items", [])]
        names += list(meal.get("not_found", []))
        for name in names:
            if name and find_matches(str(name), words) and name not in bad:
                bad.append(name)
    return bad

