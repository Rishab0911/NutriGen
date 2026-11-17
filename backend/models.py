
from pydantic import BaseModel, Field
from typing import Literal


# ---------------- USER INPUT MODEL ----------------

class UserProfile(BaseModel):
    name: str
    age: int = Field(gt=0, le=120)
    height: float = Field(gt=0)

    gender: Literal["Male", "Female", "Other"]

    goal: Literal[
        "Weight Loss",
        "Weight Gain",
        "Maintain Weight"
    ]

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

    diet: Literal[
        "Vegetarian",
        "Non-Vegetarian",
        "Vegan"
    ]

    preferences: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    restrictions: list[str] = Field(default_factory=list)

    otherPreference: str = ""
    include: str = ""
    avoid: str = ""
    otherAllergy: str = ""


# ---------------- NUTRITION MODELS ----------------

class Macros(BaseModel):
    protein: float
    carbs: float
    fat: float


# ---------------- FOOD ITEM MODEL ----------------

class MealItem(BaseModel):
    food: str
    grams: float
    calories: float
    protein: float
    carbs: float
    fat: float


# ---------------- MEAL TOTALS MODEL ----------------

class MealTotals(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


# ---------------- MEAL MODEL ----------------

class Meal(BaseModel):
    meal: str
    dish: str
    totals: MealTotals
    items: list[MealItem]
    not_found: list[str] = Field(default_factory=list)


# ---------------- DAILY TOTALS MODEL ----------------

class DayTotals(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float


# ---------------- NUTRIENT COMPARISON MODEL ----------------

class NutrientComparison(BaseModel):
    target: float
    actual: float
    difference: float
    percent_error: float | None


class Comparison(BaseModel):
    calories: NutrientComparison
    protein: NutrientComparison
    carbs: NutrientComparison
    fat: NutrientComparison


# ---------------- FINAL API RESPONSE MODEL ----------------

class MealPlanResponse(BaseModel):
    status: str

    bmr: float
    tdee: float
    daily_calories: float

    macros: Macros

    meals: list[Meal]
    day_totals: DayTotals
    comparison: Comparison

    not_found: list[str] = Field(default_factory=list)

    ai_status: str
    passed: bool
    best_attempt: int
    problems_left: list[str] = Field(default_factory=list)
