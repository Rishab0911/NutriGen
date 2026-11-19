from datetime import date, datetime, timedelta

import proactive
from proactive import (
    UserState,
    can_notify,
    record_notification,
    run_check,
)


def _state():
    state = UserState("test-user", 2000, 100)
    state.log_meal(800, 40, datetime(2026, 11, 4, 17, 0))
    return state


def _at(hour, minute=0):
    return datetime(2026, 11, 4, hour, minute)


def test_same_trigger_cooldown_allows_another_trigger():
    state = _state()
    first = run_check(state, _at(18))
    assert first["trigger"] == "low_calories"
    record_notification(state, first, _at(18))

    second = run_check(state, _at(18))
    assert second["trigger"] == "low_protein"
    record_notification(state, second, _at(18))

    assert run_check(state, _at(18)) is None


def test_trigger_can_repeat_after_its_cooldown():
    state = _state()
    record_notification(state, {"trigger": "low_calories"}, _at(18))
    action = run_check(state, _at(21, 30))
    assert action["trigger"] == "low_calories"


def test_daily_limit_and_notification_switch():
    state = _state()
    state.notifications_today = proactive.MAX_NOTIFICATIONS_PER_DAY
    assert run_check(state, _at(18)) is None

    state.notifications_today = 0
    state.notifications_enabled = False
    assert run_check(state, _at(18)) is None


def test_new_day_resets_daily_count_but_keeps_cooldown_history():
    state = _state()
    state.notifications_today = 3
    state.last_notified["low_calories"] = _at(17)
    state.day = date(2026, 11, 4)

    state.start_day_if_new(datetime(2026, 11, 5, 8, 0))

    assert state.notifications_today == 0
    assert "low_calories" in state.last_notified
    assert state.day == date(2026, 11, 5)

