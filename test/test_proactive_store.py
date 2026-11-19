from datetime import datetime

import backend.proactive_store as store
from proactive import UserState

def test_meal_log_is_saved_and_can_be_undone(tmp_path, monkeypatch):
    monkeypatch.setattr(store, "DATABASE_PATH", tmp_path / "test_proactive.sqlite3")
    store.init_db()
    state = UserState("browser-user", 2000, 100)
    state.start_day_if_new(datetime(2026, 11, 18, 8, 0))
    store.save_state(state)

    logged = store.set_meal_log(
        state, "Breakfast", 420, 22, True,
        now=datetime(2026, 11, 18, 8, 30),
    )
    assert len(logged) == 1
    assert state.calories_logged == 420
    assert state.protein_logged == 22

    remaining = store.set_meal_log(
        state, "Breakfast", 420, 22, False,
        now=datetime(2026, 11, 18, 9, 0),
    )
    assert remaining == []
    assert state.calories_logged == 0
    assert state.protein_logged == 0
    assert state.last_meal_time is None

