
from contextlib import asynccontextmanager
from datetime import datetime
import threading

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.models import UserProfile, MealPlanResponse
from backend.nutrition import calculate_nutrition
from backend import proactive_store
from planner import generate_meal_plan

from proactive import (
    UserState,
    make_scheduler,
    run_forever,
    state_from_profile,
    write_message,
)


PROACTIVE_STATES = []
PROACTIVE_BY_ID = {}
PROACTIVE_LOCK = threading.RLock()

SCHEDULER_STOP = threading.Event()
SCHEDULER_THREAD = None


# ---------------- PROACTIVE NOTIFICATION FUNCTIONS ----------------

def _deliver_proactive_notification(state, action):
    # The frontend polls the stored notification while NutriGen is open.
    message = write_message(state, action)

    proactive_store.add_notification(
        state.user_id,
        action["trigger"],
        message,
    )


def _persist_proactive_state(state):
    proactive_store.save_state(state)


# ---------------- APPLICATION LIFESPAN ----------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global SCHEDULER_THREAD

    proactive_store.init_db()

    with PROACTIVE_LOCK:
        PROACTIVE_STATES.clear()
        PROACTIVE_BY_ID.clear()

        for state in proactive_store.load_states():
            state.start_day_if_new()
            proactive_store.save_state(state)

            PROACTIVE_STATES.append(state)
            PROACTIVE_BY_ID[state.user_id] = state

    SCHEDULER_STOP.clear()

    scheduler = make_scheduler(
        PROACTIVE_STATES,
        _deliver_proactive_notification,
        minutes=30,
        after_record=_persist_proactive_state,
    )

    SCHEDULER_THREAD = threading.Thread(
        target=run_forever,
        kwargs={
            "scheduler": scheduler,
            "pause_seconds": 30,
            "stop_event": SCHEDULER_STOP,
        },
        name="nutrigen-proactive-scheduler",
        daemon=True,
    )

    SCHEDULER_THREAD.start()

    try:
        yield

    finally:
        SCHEDULER_STOP.set()

        if SCHEDULER_THREAD:
            SCHEDULER_THREAD.join(timeout=3)


# ---------------- FASTAPI APPLICATION ----------------

app = FastAPI(
    title="NutriGen Backend",
    description="Personalized meal planning and proactive nutrition reminders.",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- PROACTIVE API REQUEST MODELS ----------------

class ProactiveRegisterRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)
    calorie_target: float = Field(gt=0)
    protein_target: float = Field(ge=0)

    diet: str = ""

    allergies: list[str] = Field(default_factory=list)
    preferences: list[str] = Field(default_factory=list)
    restrictions: list[str] = Field(default_factory=list)


class ProactiveMealLogRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)
    meal_label: str = Field(min_length=1, max_length=40)

    calories: float = Field(ge=0)
    protein: float = Field(ge=0)

    logged: bool


class ProactiveSettingsRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=100)
    enabled: bool


# ---------------- HOME ROUTE ----------------

@app.get("/")
def home():
    return {
        "message": "NutriGen Backend is Running!"
    }


# ---------------- HEALTH CHECK ----------------

@app.get("/health")
def health_check():
    return {
        "status": "Backend is healthy!"
    }


# ---------------- GENERATE MEAL PLAN ----------------

@app.post(
    "/generate-meal",
    response_model=MealPlanResponse,
)
def generate_meal(data: UserProfile):

    nutrition = calculate_nutrition(
        age=data.age,
        height=data.height,
        gender=data.gender,
        weight=data.weight,
        activity=data.activity,
        goal=data.goal,
        calories=data.calories,
        preferences=data.preferences,
    )

    # Accept multiple custom allergies separated by commas or semicolons.
    allergies = [
        str(item).strip()
        for item in data.allergies
        if str(item).strip()
    ]

    for word in data.otherAllergy.replace(";", ",").split(","):
        if word.strip():
            allergies.append(word.strip())

    preferences = list(data.preferences)

    if data.otherPreference.strip():
        preferences.append(data.otherPreference.strip())

    if data.include.strip():
        preferences.append(
            "Foods to include: " + data.include.strip()
        )

    if data.avoid.strip():
        preferences.append(
            "Foods to avoid: " + data.avoid.strip()
        )

    planner_profile = {
        "calories": nutrition["daily_calories"],
        "protein": nutrition["macros"]["protein"],
        "carbs": nutrition["macros"]["carbs"],
        "fat": nutrition["macros"]["fat"],
        "diet": data.diet,
        "allergies": allergies,
        "preferences": preferences,
        "restrictions": data.restrictions,
    }

    try:
        ai_output = generate_meal_plan(planner_profile)

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error

    result = ai_output["result"]

    if not result:
        raise HTTPException(
            status_code=503,
            detail="The AI did not return a valid meal plan.",
        )

    # Return the validation status even when the plan is partial.
    # This preserves the existing API response structure.

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
        "ai_status": "success" if ai_output["passed"] else "partial",
        "passed": ai_output["passed"],
        "best_attempt": ai_output["best_attempt"],
        "problems_left": ai_output["problems_left"],
    }


# ---------------- PROACTIVE REMINDER ROUTES ----------------

@app.post("/proactive/register")
def register_proactive_user(data: ProactiveRegisterRequest):

    profile = {
        "calories": data.calorie_target,
        "protein": data.protein_target,
        "diet": data.diet,
        "allergies": data.allergies,
        "preferences": data.preferences,
        "restrictions": data.restrictions,
    }

    with PROACTIVE_LOCK:

        state = PROACTIVE_BY_ID.get(data.user_id)

        if state is None:

            state = state_from_profile(
                data.user_id,
                profile,
            )

            state.start_day_if_new()

            PROACTIVE_BY_ID[data.user_id] = state
            PROACTIVE_STATES.append(state)

        else:

            state.calorie_target = data.calorie_target
            state.protein_target = data.protein_target
            state.diet = data.diet

            state.allergies = list(data.allergies)
            state.preferences = list(data.preferences)
            state.restrictions = list(data.restrictions)

            state.start_day_if_new()

        proactive_store.save_state(state)

    return {
        "status": "registered",
        "user_id": data.user_id,
    }


@app.post("/proactive/log-meal")
def log_proactive_meal(data: ProactiveMealLogRequest):

    with PROACTIVE_LOCK:

        state = PROACTIVE_BY_ID.get(data.user_id)

        if state is None:
            raise HTTPException(
                status_code=404,
                detail="Reminder profile not found.",
            )

        meals = proactive_store.set_meal_log(
            state,
            data.meal_label,
            data.calories,
            data.protein,
            data.logged,
            now=datetime.now(),
        )

        return {
            "status": "success",
            "calories_logged": state.calories_logged,
            "protein_logged": state.protein_logged,
            "meals": meals,
        }


@app.post("/proactive/settings")
def update_proactive_settings(data: ProactiveSettingsRequest):

    with PROACTIVE_LOCK:

        state = PROACTIVE_BY_ID.get(data.user_id)

        if state is None:
            raise HTTPException(
                status_code=404,
                detail="Reminder profile not found.",
            )

        state.notifications_enabled = data.enabled

        proactive_store.save_state(state)

    return {
        "status": "success",
        "enabled": data.enabled,
    }


@app.get("/proactive/status/{user_id}")
def proactive_status(user_id: str):

    with PROACTIVE_LOCK:

        state = PROACTIVE_BY_ID.get(user_id)

        if state is None:
            raise HTTPException(
                status_code=404,
                detail="Reminder profile not found.",
            )

        state.start_day_if_new()
        proactive_store.save_state(state)

        return {
            "user_id": state.user_id,
            "enabled": state.notifications_enabled,
            "calories_logged": round(state.calories_logged, 1),
            "protein_logged": round(state.protein_logged, 1),
            "calories_remaining": round(state.calories_remaining(), 1),
            "protein_remaining": round(state.protein_remaining(), 1),
            "notifications_today": state.notifications_today,
            "max_notifications_per_day": 4,
            "meals": proactive_store.get_meal_logs(user_id),
            "notifications": proactive_store.get_notifications(user_id),
        }


# ---------------- EXISTING TEST / DEMO ROUTES ----------------

@app.post("/test-user")
def test_user(data: dict):
    return {
        "message": "User data received",
        "name": data["name"],
        "age": data["age"],
    }


@app.get("/user/{user_id}")
def get_user(user_id: int):
    return {
        "message": "User found",
        "user_id": user_id,
    }


@app.get("/search")
def search(name: str):
    return {
        "message": "Search results",
        "name": name,
    }


@app.get("/meal-info")
def meal_info(goal: str, diet: str):
    return {
        "goal": goal,
        "diet": diet,
        "message": "Meal information requested",
    }


@app.get("/test-error")
def test_error():
    raise HTTPException(
        status_code=404,
        detail="User not found",
    )
