
from fastapi import FastAPI, HTTPException

from backend.models import UserProfile, MealPlanResponse
from backend.nutrition import calculate_nutrition

from planner import generate_meal_plan


app = FastAPI()


# ---------------- HOME ROUTE ----------------

@app.get("/")
def home():
    return {"message": "NutriGen Backend is Running!"}


# ---------------- HEALTH CHECK ----------------

@app.get("/health")
def health_check():
    return {"status": "Backend is healthy!"}


# ---------------- GENERATE MEAL PLAN ----------------

@app.post("/generate-meal", response_model=MealPlanResponse)
def generate_meal(data: UserProfile):

    # Step 1: Calculate the user's nutrition requirements
    nutrition = calculate_nutrition(
        age=data.age,
        height=data.height,
        gender=data.gender,
        weight=data.weight,
        activity=data.activity,
        goal=data.goal,
        calories=data.calories,
        preferences=data.preferences
    )

    # Step 2: Prepare the profile for Aahana's meal planner
    allergies = list(data.allergies)

    if data.otherAllergy.strip():
        allergies.append(data.otherAllergy.strip())

    preferences = list(data.preferences)

    if data.otherPreference.strip():
        preferences.append(data.otherPreference.strip())

    if data.include.strip():
        preferences.append("Foods to include: " + data.include.strip())

    if data.avoid.strip():
        preferences.append("Foods to avoid: " + data.avoid.strip())

    planner_profile = {
        "calories": nutrition["daily_calories"],
        "protein": nutrition["macros"]["protein"],
        "carbs": nutrition["macros"]["carbs"],
        "fat": nutrition["macros"]["fat"],
        "diet": data.diet,
        "allergies": allergies,
        "preferences": preferences,
        "restrictions": data.restrictions
    }

    # Step 3: Generate the meal plan using Aahana's planner
    try:
        ai_output = generate_meal_plan(planner_profile)

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Meal plan generation failed. "
                "No suitable plan could be generated. "
                "Please try again."
            )
        ) from error

    # Step 4: Get the generated meal plan
    result = ai_output["result"]

    if not result:
        raise HTTPException(
            status_code=503,
            detail="The AI did not return a valid meal plan."
        )

    # Step 5: Return the final response
    return {
        "status": "success",
        "bmr": nutrition["bmr"],
        "tdee": nutrition["tdee"],
        "daily_calories": nutrition["daily_calories"],
        "macros": nutrition["macros"],

        "meals": result["meals"],
        "day_totals": result["day_totals"],
        "comparison": result["comparison"],
        "not_found": result["not_found"],

        "ai_status": (
            "success" if ai_output["passed"] else "partial"
        ),
        "passed": ai_output["passed"],
        "best_attempt": ai_output["best_attempt"],
        "problems_left": ai_output["problems_left"]
    }


# ---------------- TEST USER ROUTE ----------------

@app.post("/test-user")
def test_user(data: dict):
    return {
        "message": "User data received",
        "name": data["name"],
        "age": data["age"]
    }


# ---------------- GET USER ROUTE ----------------

@app.get("/user/{user_id}")
def get_user(user_id: int):
    return {
        "message": "User found",
        "user_id": user_id
    }


# ---------------- SEARCH ROUTE ----------------

@app.get("/search")
def search(name: str):
    return {
        "message": "Search results",
        "name": name
    }


# ---------------- MEAL INFO ROUTE ----------------

@app.get("/meal-info")
def meal_info(goal: str, diet: str):
    return {
        "goal": goal,
        "diet": diet,
        "message": "Meal information requested"
    }


# ---------------- TEST ERROR ROUTE ----------------

@app.get("/test-error")
def test_error():
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )
