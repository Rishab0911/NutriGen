from fastapi import FastAPI,HTTPException
from models import UserProfile, MealPlanResponse
from nutrition import calculate_nutrition
from ai import (
    prepare_ai_requirements,
    parse_ai_response,
    generate_mock_ai_response,
    get_fallback_meal_plan
)


app = FastAPI()
app = FastAPI()

@app.get("/")
def home():
    return {"message": "NutriGen Backend is Running!"}

@app.post(
    "/generate-meal",
    response_model=MealPlanResponse
)

@app.post("/generate-meal", response_model=MealPlanResponse)
def generate_meal(
    data: UserProfile,
    simulate_ai_failure: bool = False
):
    profile = data.dict()

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

    ai_result = prepare_ai_requirements(
        profile=profile,
        nutrition=nutrition
    )

    try:
        # Temporary switch to test error handling in Swagger.
        if simulate_ai_failure:
            raise RuntimeError("Simulated AI failure")

        response_text = generate_mock_ai_response(
            ai_result["requirements"]
        )

        parsed_response = parse_ai_response(response_text)

        meal_plan = parsed_response["meal_plan"]
        ai_status = "success"

    except Exception:
        # Use the backup plan if generation or parsing fails.
        fallback = get_fallback_meal_plan()
        meal_plan = fallback["meal_plan"]
        ai_status = "fallback"

    return {
        "status": "success",
        **nutrition,
        "meal_plan": meal_plan,
        "ai_request": ai_result,
        "ai_status": ai_status
    }


@app.get("/health")
def health_check():
    return{"status":"Backend is healthy!"}

@app.post("/test-user")
def test_user(data:dict):
    return {
        "message":"User data received",
        "name":data["name"],
        "age":data["age"]
    }

@app.get("/user/{user_id}")
def get_user(user_id: int):
    return {
        "message": "User found",
        "user_id": user_id
    }
@app.get("/search")
def search(name:str):
    return {
        "message": "Search results",
        "name": name
    }

@app.get("/meal-info")
def meal_info(goal: str, diet: str):
    return {
        "goal": goal,
        "diet": diet,
        "message": "Meal information requested"
    }

@app.get("/test-error")
def test_error():
    raise HTTPException(
        status_code=404,
        detail="User not found"
    )
