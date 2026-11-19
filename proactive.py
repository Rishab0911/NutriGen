"""Proactive nutrition reminders for NutriGen.

The rule engine is deliberately independent from FastAPI and the browser.
The backend supplies a notification callback and persists UserState.
"""
import logging
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from threading import Event

import schedule

from nutrition import find_matches, restricted_words
from prompts import PROACTIVE_SYSTEM_PROMPT, build_proactive_prompt

LONG_GAP_HOURS = 5
AWAKE_START = 7
AWAKE_END = 22
NO_MEAL_BY_HOUR = 11
EVENING_HOUR = 18
LOW_CALORIE_SHARE = 0.5
LOW_PROTEIN_SHARE = 0.5
OVER_CALORIE_SHARE = 1.1

MAX_NOTIFICATIONS_PER_DAY = 4
DEFAULT_COOLDOWN_HOURS = 3
COOLDOWN_HOURS = {
    "no_meal_yet": 3,
    "long_gap": 3,
    "low_calories": 3,
    "low_protein": 4,
    "over_calories": 6,
}
CHECK_EVERY_MINUTES = 30
MAX_MESSAGE_CHARS = 280
logger = logging.getLogger(__name__)


@dataclass
class UserState:
    """Current nutrition and reminder state for one browser user."""
    user_id: str
    calorie_target: float
    protein_target: float
    diet: str = ""
    allergies: list = field(default_factory=list)
    preferences: list = field(default_factory=list)
    restrictions: list = field(default_factory=list)
    calories_logged: float = 0.0
    protein_logged: float = 0.0
    last_meal_time: datetime = None
    last_notified: dict = field(default_factory=dict)
    notifications_enabled: bool = True
    notifications_today: int = 0
    day: date = None

    def log_meal(self, calories, protein, when=None):
        self.start_day_if_new(when)
        self.calories_logged += float(calories)
        self.protein_logged += float(protein)
        self.last_meal_time = when or datetime.now()

    def hours_since_last_meal(self, now=None):
        if self.last_meal_time is None:
            return None
        now = now or datetime.now()
        return (now - self.last_meal_time).total_seconds() / 3600

    def calories_remaining(self):
        return self.calorie_target - self.calories_logged

    def protein_remaining(self):
        return self.protein_target - self.protein_logged

    def reset_day(self):
        """Clear today's food totals; retain cooldown history."""
        self.calories_logged = 0.0
        self.protein_logged = 0.0
        self.last_meal_time = None
        self.notifications_today = 0

    def start_day_if_new(self, now=None):
        today = (now or datetime.now()).date()
        if self.day is None:
            self.day = today
        elif today != self.day:
            self.reset_day()
            self.day = today


def state_from_profile(user_id, profile):
    return UserState(
        user_id=user_id,
        calorie_target=float(profile["calories"]),
        protein_target=float(profile["protein"]),
        diet=profile.get("diet", ""),
        allergies=list(profile.get("allergies") or []),
        preferences=list(profile.get("preferences") or []),
        restrictions=list(profile.get("restrictions") or []),
    )


def detect_triggers(state, now=None):
    now = now or datetime.now()
    hour = now.hour
    triggers = []
    if not AWAKE_START <= hour < AWAKE_END:
        return triggers

    gap = state.hours_since_last_meal(now)
    if gap is None:
        if hour >= NO_MEAL_BY_HOUR:
            triggers.append("no_meal_yet")
    elif gap > LONG_GAP_HOURS:
        triggers.append("long_gap")

    if state.calories_logged > OVER_CALORIE_SHARE * state.calorie_target:
        triggers.append("over_calories")

    if hour >= EVENING_HOUR:
        if state.calories_logged < LOW_CALORIE_SHARE * state.calorie_target:
            triggers.append("low_calories")
        if state.protein_logged < LOW_PROTEIN_SHARE * state.protein_target:
            triggers.append("low_protein")
    return triggers


RULES = {
    "no_meal_yet": {
        "action": "remind_meal", "priority": 1,
        "message": "You haven't logged a meal yet today. Time for something to eat?",
    },
    "long_gap": {
        "action": "remind_meal", "priority": 1,
        "message": "It has been {hours} hours since your last meal. Time for a meal or snack?",
    },
    "over_calories": {
        "action": "warn_over", "priority": 2,
        "message": "You are {calories_over} kcal over today's target. Keep the rest of the day light.",
    },
    "low_calories": {
        "action": "suggest_meal", "priority": 2,
        "message": "You still have {calories_left} kcal left today. A balanced meal may help.",
    },
    "low_protein": {
        "action": "suggest_protein", "priority": 3,
        "message": "You still need {protein_left} g of protein today. Consider a protein-rich option.",
    },
}


def decide_actions(triggers, state, now=None):
    gap = state.hours_since_last_meal(now)
    values = {
        "hours": round(gap, 1) if gap is not None else 0,
        "calories_left": round(state.calories_remaining()),
        "protein_left": round(state.protein_remaining()),
        "calories_over": round(-state.calories_remaining()),
    }
    actions = []
    for trigger in triggers:
        rule = RULES.get(trigger)
        if rule is None:
            continue
        actions.append({
            "trigger": trigger,
            "action": rule["action"],
            "priority": rule["priority"],
            "message": rule["message"].format(**values),
        })
    return sorted(actions, key=lambda item: item["priority"])


def top_action(actions):
    return actions[0] if actions else None


def in_cooldown(state, trigger, now=None):
    last = state.last_notified.get(trigger)
    if last is None:
        return False
    cooldown = COOLDOWN_HOURS.get(trigger, DEFAULT_COOLDOWN_HOURS)
    return (now or datetime.now()) - last < timedelta(hours=cooldown)


def can_notify(state, action, now=None):
    if not state.notifications_enabled:
        return False
    if state.notifications_today >= MAX_NOTIFICATIONS_PER_DAY:
        return False
    return not in_cooldown(state, action["trigger"], now)


def record_notification(state, action, now=None):
    state.last_notified[action["trigger"]] = now or datetime.now()
    state.notifications_today += 1


def run_check(state, now=None):
    now = now or datetime.now()
    state.start_day_if_new(now)
    for action in decide_actions(detect_triggers(state, now), state, now):
        if can_notify(state, action, now):
            return action
    return None


def make_job(states, notify, clock=datetime.now, after_record=None):
    """Create one scheduler job. after_record persists updated cooldown state."""
    def job():
        now = clock()
        for state in list(states):
            action = run_check(state, now)
            if action:
                try:
                    notify(state, action)
                except Exception:
                    logger.exception("Could not deliver proactive reminder for %s", state.user_id)
                    continue
                record_notification(state, action, now)
                if after_record:
                    try:
                        after_record(state)
                    except Exception:
                        logger.exception("Could not persist reminder state for %s", state.user_id)
    return job


def make_scheduler(states, notify, minutes=CHECK_EVERY_MINUTES,
                   clock=datetime.now, after_record=None):
    scheduler = schedule.Scheduler()
    scheduler.every(minutes).minutes.do(
        make_job(states, notify, clock, after_record)
    )
    return scheduler


def run_forever(scheduler, pause_seconds=30, stop_event=None):
    """Run scheduled checks until the supplied stop event is set."""
    while stop_event is None or not stop_event.is_set():
        try:
            scheduler.run_pending()
        except Exception:
            logger.exception("Proactive scheduler tick failed")
        if stop_event is not None:
            stop_event.wait(pause_seconds)
        else:
            time.sleep(pause_seconds)


def describe_state(state, now=None):
    parts = [
        f"calories left today: {round(state.calories_remaining())} kcal",
        f"protein left today: {round(state.protein_remaining())} g",
    ]
    gap = state.hours_since_last_meal(now)
    if gap is not None:
        parts.insert(0, f"hours since last meal: {round(gap, 1)}")
    return "; ".join(parts)


def write_message(state, action, ask_llm=None, now=None):
    """Generate a short nudge; safely fall back to the deterministic template."""
    fallback = action["message"]
    try:
        if ask_llm is None:
            from llm import send_prompt as ask_llm
        prompt = build_proactive_prompt(
            action,
            describe_state(state, now),
            state.diet,
            state.allergies,
            state.preferences,
        )
        text = str(ask_llm(prompt, PROACTIVE_SYSTEM_PROMPT) or "").strip()
    except Exception:
        return fallback

    if not text or len(text) > MAX_MESSAGE_CHARS:
        return fallback

    banned = restricted_words({
        "allergies": state.allergies,
        "diet": state.diet,
        "preferences": state.preferences,
        "restrictions": state.restrictions,
    })
    if find_matches(text, banned):
        return fallback
    return text
