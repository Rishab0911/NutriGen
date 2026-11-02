from dataclasses import dataclass, field
from datetime import datetime

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