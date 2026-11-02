import time
from dataclasses import dataclass, field
from datetime import datetime
import schedule

from nutrition import find_matches, restricted_words
from prompts import PROACTIVE_SYSTEM_PROMPT, build_proactive_prompt

LONG_GAP_HOURS = 5         # no meal logged for more than 5 hours
AWAKE_START = 7            # no nudges before 7 am
AWAKE_END = 22             # or from 10 pm
NO_MEAL_BY_HOUR = 11       # nothing logged yet by 11 am
EVENING_HOUR = 18          # "evening" checks start at 6 pm
LOW_CALORIE_SHARE = 0.5    # in the evening, below 50% of the calorie target
LOW_PROTEIN_SHARE = 0.5    # in the evening, below 50% of the protein target
OVER_CALORIE_SHARE = 1.1   # above 110% of the calorie target


@dataclass
class UserState:
    """What the proactive layer knows about one user right now."""
    user_id: str
    calorie_target: float
    protein_target: float
    diet: str = ""
    allergies: list = field(default_factory=list)
    preferences: list = field(default_factory=list)
    calories_logged: float = 0.0
    protein_logged: float = 0.0
    last_meal_time: datetime = None
    last_notified: dict = field(default_factory=dict)

    def log_meal(self, calories, protein, when=None):
        self.calories_logged += calories
        self.protein_logged += protein
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
        """New day: clear the logs, keep the notification history."""
        self.calories_logged = 0.0
        self.protein_logged = 0.0
        self.last_meal_time = None


def state_from_profile(user_id, profile):
    """Build a UserState from the same profile dict the planner uses."""
    return UserState(
        user_id=user_id,
        calorie_target=profile["calories"],
        protein_target=profile["protein"],
        diet=profile.get("diet", ""),
        allergies=list(profile.get("allergies") or []),
        preferences=list(profile.get("preferences") or []),
    )


def detect_triggers(state, now=None):
    """Return the names of the triggers that apply to this user right now."""
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
        low_cal = LOW_CALORIE_SHARE * state.calorie_target
        low_pro = LOW_PROTEIN_SHARE * state.protein_target
        if state.calories_logged < low_cal:
            triggers.append("low_calories")
        if state.protein_logged < low_pro:
            triggers.append("low_protein")
    return triggers

RULES = {
    "no_meal_yet": {
        "action": "remind_meal", "priority": 1,
        "message": "You haven't logged a meal yet today. "
                   "Time for something to eat?",
    },
    "long_gap": {
        "action": "remind_meal", "priority": 1,
        "message": "It has been {hours} hours since your last meal. "
                   "Time for a meal or snack?",
    },
    "over_calories": {
        "action": "warn_over", "priority": 2,
        "message": "You are {calories_over} kcal over today's target. "
                   "Keep the rest of the day light.",
    },
    "low_calories": {
        "action": "suggest_meal", "priority": 2,
        "message": "You still have {calories_left} kcal left today. "
                   "A proper meal is due.",
    },
    "low_protein": {
        "action": "suggest_protein", "priority": 3,
        "message": "You still need {protein_left} g of protein today. "
                   "Add a protein-rich food.",
    },
}


def decide_actions(triggers, state, now=None):
    """Turn trigger names into actions, most important first."""
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
    return sorted(actions, key=lambda a: a["priority"])


def top_action(actions):
    """The single most important action, or None. One nudge per check."""
    return actions[0] if actions else None

CHECK_EVERY_MINUTES = 30


def run_check(state, now=None):
    """One proactive check for one user. Returns the top action or None."""
    triggers = detect_triggers(state, now)
    actions = decide_actions(triggers, state, now)
    return top_action(actions)


def make_job(states, notify, clock=datetime.now):
    """Build the function the scheduler runs on every tick."""
    def job():
        now = clock()
        for state in states:
            action = run_check(state, now)
            if action:
                notify(state, action)
    return job


def make_scheduler(states, notify, minutes=CHECK_EVERY_MINUTES,
                   clock=datetime.now):
    """A scheduler that checks every user every `minutes` minutes."""
    scheduler = schedule.Scheduler()
    scheduler.every(minutes).minutes.do(make_job(states, notify, clock))
    return scheduler


def run_forever(scheduler, pause_seconds=30):
    """Keep running due checks. Stop it with Ctrl+C."""
    while True:
        scheduler.run_pending()
        time.sleep(pause_seconds)

MAX_MESSAGE_CHARS = 280


def describe_state(state, now=None):
    """The facts we give Gemini, as one plain line."""
    parts = [
        f"calories left today: {round(state.calories_remaining())} kcal",
        f"protein left today: {round(state.protein_remaining())} g",
    ]
    gap = state.hours_since_last_meal(now)
    if gap is not None:
        parts.insert(0, f"hours since last meal: {round(gap, 1)}")
    return "; ".join(parts)


def write_message(state, action, ask_llm=None, now=None):
    """Ask Gemini for a friendly version of the nudge. Falls back to the
    template if the call fails or the text is empty, too long or unsafe."""
    fallback = action["message"]
    try:
        if ask_llm is None:
            from llm import send_prompt as ask_llm
        prompt = build_proactive_prompt(
            action, describe_state(state, now), state.diet,
            state.allergies, state.preferences)
        text = str(ask_llm(prompt, PROACTIVE_SYSTEM_PROMPT)).strip()
    except Exception:
        return fallback
    if not text or len(text) > MAX_MESSAGE_CHARS:
        return fallback
    banned = restricted_words(
        {"allergies": state.allergies, "diet": state.diet})
    if find_matches(text, banned):
        return fallback
    return text