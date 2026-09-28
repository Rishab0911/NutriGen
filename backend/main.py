from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "NutriGen Backend is Running!"}

@app.post("/generate-meal")
def generate_meal(data: dict):
    return {
        "status": "success",
        "age":data["age"],
        "goal":data["goal"],
        "message": "Meal plan request received",
        "user_data": data
    }