from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    weight: float=Field(gt=0)
    age: int=Field(gt=0,lt=120)
    goal: str
    diet: str

class Meal(BaseModel):
    meal: str
    food: str
    calories: float

class MealPlanResponse(BaseModel):
    status: str
    daily_calories: float
    meal_plan: list[Meal]