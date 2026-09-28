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
   Nutrition data comes from USDA FoodData Central (Foundation + SR Legacy). Run `python fetch_data.py` to download it into `data/raw/`.