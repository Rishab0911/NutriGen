import sys
import os
from datetime import date, datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import proactive
from proactive import UserState, run_check, record_notification, make_job


def _state():
    """A user with 800 kcal and 40 g protein logged at 5 pm."""
    state = UserState("test_user", calorie_target=2000, protein_target=110)
    state.log_meal(800, 40, datetime(2026, 11, 4, 17, 0))
    return state


def _at(hour, minute=0):
    return datetime(2026, 11, 4, hour, minute)


def test_same_trigger_is_not_sent_twice_in_a_row():
    state = _state()
    first = run_check(state, _at(18))
    record_notification(state, first, _at(18))
    second = run_check(state, _at(18))
    assert first["trigger"] == "low_calories"
    assert second["trigger"] == "low_protein"   # lower priority is still allowed
    record_notification(state, second, _at(18))
    assert run_check(state, _at(18)) is None    # both are now in cooldown


def test_trigger_can_be_sent_again_after_its_cooldown():
    state = _state()
    record_notification(state, {"trigger": "low_calories"}, _at(18))
    action = run_check(state, _at(21, 30))      # 3.5 hours later
    assert action["trigger"] == "low_calories"


def test_daily_limit_stops_notifications():
    state = _state()
    state.notifications_today = proactive.MAX_NOTIFICATIONS_PER_DAY
    assert run_check(state, _at(18)) is None


def test_user_can_switch_notifications_off():
    state = _state()
    state.notifications_enabled = False
    assert run_check(state, _at(18)) is None


def test_new_day_resets_logs_and_count():
    state = _state()
    state.day = date(2026, 11, 3)
    state.notifications_today = 3
    run_check(state, datetime(2026, 11, 4, 12, 0))
    assert state.calories_logged == 0
    assert state.notifications_today == 0
    assert state.day == date(2026, 11, 4)


def test_scheduler_job_does_not_repeat_nudges():
    state = _state()
    sent = []
    job = make_job([state], lambda s, a: sent.append(a["trigger"]),
                   clock=lambda: _at(18))
    job()
    job()
    job()
    assert sent == ["low_calories", "low_protein"]
