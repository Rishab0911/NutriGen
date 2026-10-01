from fastapi import FastAPI,HTTPException
from pydantic import BaseModel,Field

app = FastAPI()
app = FastAPI()

class UserData(BaseModel):
    weight: float=Field(gt=0)
    age: int=Field(gt=0,lt=120)
    goal: str
    diet: str
@app.get("/")
def home():
    return {"message": "NutriGen Backend is Running!"}

@app.post("/generate-meal")
def generate_meal(data: UserData):
    return {
        "status": "success",
        "message": "Dummy meal plan generated",
        "meal_plan": [
            {
                "meal": "Breakfast",
                "food": "Oats with milk",
                "calories": 400
            },
            {
                "meal": "Lunch",
                "food": "Rice, dal and vegetables",
                "calories": 600
            },
            {
                "meal": "Dinner",
                "food": "Chapati with paneer",
                "calories": 550
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