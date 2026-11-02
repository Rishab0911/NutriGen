# NutriGen

NutriGen is a personalized meal planning system that uses nutrition
reference data and a Large Language Model (LLM) to generate
personalized meal plans.

## My Responsibility

- Nutrition reference data
- Nutrition data retrieval
- LLM integration
- Prompt engineering
- Few-shot prompting
- Structured JSON generation
- Dietary restriction handling
- Model evaluation

## Project Pipeline

User Profile
↓
Nutrition Database
↓
Nutrition Retrieval
↓
Prompt Engineering
↓
LLM
↓
Structured Meal Plan
↓
Evaluation




## Project Modules

### nutrition.py
Handles nutrition data and food-related operations.

### prompts.py
Contains prompts and instructions used to guide the LLM.

### llm.py
Handles communication with the selected LLM.

### evaluation.py
Evaluates generated meal plans using quantitative and rule-based metrics.


 ## Data
Nutrition data comes from USDA FoodData Central: Foundation Foods, SR Legacy, and a random sample of Branded Foods. Run `build_fulldata.py` and `build_paper_data.py` to fetch raw data, then `clean_data.py` to produce the final cleaned dataset at `data/clean/nutrition_clean.csv` (8,002 foods: food, quantity, unit, calories, protein, carbs, fat — all values per 100g).

## Nutrition Module (`nutrition.py`)
- `load_nutrition_data()` — loads the cleaned dataset as a pandas DataFrame
- `get_food_names()` — returns a list of all food names
- `get_food(name)` — exact-match lookup for a single food
- `search_food(keyword)` — case-insensitive partial-match search across all foods

## Tests
Run `pytest test/test_get_food.py -v` to verify retrieval functions.