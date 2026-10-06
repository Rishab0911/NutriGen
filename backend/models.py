from pydantic import BaseModel, Field
from typing import Literal


class UserProfile(BaseModel):
    name: str
    age: int = Field(gt=0, le=120)
    height: float = Field(gt=0)
    gender: Literal["Male", "Female"]
    goal: Literal["Weight Loss", "Weight Gain", "Maintain Weight"]
    weight: float = Field(gt=0)
    target: float = Field(gt=0)

    calories: float | None = Field(
        default=None,
        ge=1000,
        le=6000
    )

    activity: float = Field(
        ge=1.2,
        le=1.725
    )

    diet: str

    preferences: list[str] = []
    allergies: list[str] = []
    restrictions: list[str] = []

    otherPreference: str = ""
    include: str = ""
    avoid: str = ""
    otherAllergy: str = ""


class Macros(BaseModel):
    protein: float
    carbs: float
    fat: float


class MealPlanResponse(BaseModel):
    status: str
    bmr: float
    tdee: float
    daily_calories: float
    macros: Macros