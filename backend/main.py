from fastapi import FastAPI,HTTPException
from models import UserProfile, MealPlanResponse
from nutrition import calculate_calories

app = FastAPI()
app = FastAPI()

@app.get("/")
def home():
    return {"message": "NutriGen Backend is Running!"}

@app.post("/generate-meal", response_model=MealPlanResponse)
def generate_meal(data: UserProfile):

    daily_calories = calculate_calories(data.weight, data.goal)

    return {
        "status": "success",
        "daily_calories": daily_calories,
        "meal_plan": [
            {
                "meal": "Breakfast",
                "food": "Oats with milk",
                "calories": 500
            },
            {
                "meal": "Lunch",
                "food": "Rice, dal and vegetables",
                "calories": 700
            },
            {
                "meal": "Dinner",
                "food": "Chapati with paneer",
                "calories": 600
            }
        ]
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
