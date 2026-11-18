"""SQLite persistence for NutriGen proactive reminders.

The database is stored in the user's home directory, outside the Git project.
"""
import json
import sqlite3
from datetime import date, datetime
from pathlib import Path

from proactive import UserState

DATABASE_PATH = Path.home() / ".nutrigen" / "proactive.sqlite3"


def _connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with _connect() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                calorie_target REAL NOT NULL,
                protein_target REAL NOT NULL,
                diet TEXT NOT NULL DEFAULT '',
                allergies TEXT NOT NULL DEFAULT '[]',
                preferences TEXT NOT NULL DEFAULT '[]',
                restrictions TEXT NOT NULL DEFAULT '[]',
                calories_logged REAL NOT NULL DEFAULT 0,
                protein_logged REAL NOT NULL DEFAULT 0,
                last_meal_time TEXT,
                last_notified TEXT NOT NULL DEFAULT '{}',
                notifications_enabled INTEGER NOT NULL DEFAULT 1,
                notifications_today INTEGER NOT NULL DEFAULT 0,
                day TEXT
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS meal_logs (
                user_id TEXT NOT NULL,
                day TEXT NOT NULL,
                meal_label TEXT NOT NULL,
                calories REAL NOT NULL,
                protein REAL NOT NULL,
                logged_at TEXT NOT NULL,
                PRIMARY KEY (user_id, day, meal_label)
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                trigger TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)


def save_state(state):
    last_notified = {
        key: value.isoformat() if isinstance(value, datetime) else str(value)
        for key, value in state.last_notified.items()
    }
    with _connect() as db:
        db.execute("""
            INSERT INTO users (
                user_id, calorie_target, protein_target, diet, allergies,
                preferences, restrictions, calories_logged, protein_logged,
                last_meal_time, last_notified, notifications_enabled,
                notifications_today, day
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                calorie_target=excluded.calorie_target,
                protein_target=excluded.protein_target,
                diet=excluded.diet,
                allergies=excluded.allergies,
                preferences=excluded.preferences,
                restrictions=excluded.restrictions,
                calories_logged=excluded.calories_logged,
                protein_logged=excluded.protein_logged,
                last_meal_time=excluded.last_meal_time,
                last_notified=excluded.last_notified,
                notifications_enabled=excluded.notifications_enabled,
                notifications_today=excluded.notifications_today,
                day=excluded.day
        """, (
            state.user_id, state.calorie_target, state.protein_target,
            state.diet, json.dumps(state.allergies),
            json.dumps(state.preferences), json.dumps(state.restrictions),
            state.calories_logged, state.protein_logged,
            state.last_meal_time.isoformat() if state.last_meal_time else None,
            json.dumps(last_notified), int(state.notifications_enabled),
            state.notifications_today, state.day.isoformat() if state.day else None,
        ))


def load_states():
    init_db()
    states = []
    with _connect() as db:
        rows = db.execute("SELECT * FROM users").fetchall()
    for row in rows:
        state = UserState(
            user_id=row["user_id"],
            calorie_target=row["calorie_target"],
            protein_target=row["protein_target"],
            diet=row["diet"],
            allergies=json.loads(row["allergies"] or "[]"),
            preferences=json.loads(row["preferences"] or "[]"),
            restrictions=json.loads(row["restrictions"] or "[]"),
            calories_logged=row["calories_logged"],
            protein_logged=row["protein_logged"],
            last_meal_time=datetime.fromisoformat(row["last_meal_time"])
                if row["last_meal_time"] else None,
            notifications_enabled=bool(row["notifications_enabled"]),
            notifications_today=row["notifications_today"],
            day=date.fromisoformat(row["day"]) if row["day"] else None,
        )
        saved_history = json.loads(row["last_notified"] or "{}")
        state.last_notified = {
            key: datetime.fromisoformat(value)
            for key, value in saved_history.items()
        }
        states.append(state)
    return states


def set_meal_log(state, meal_label, calories, protein, logged, now=None):
    """Upsert or remove a meal log, then recalculate today's totals."""
    now = now or datetime.now()
    state.start_day_if_new(now)
    today = now.date().isoformat()

    with _connect() as db:
        if logged:
            db.execute("""
                INSERT INTO meal_logs
                    (user_id, day, meal_label, calories, protein, logged_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id, day, meal_label) DO UPDATE SET
                    calories=excluded.calories,
                    protein=excluded.protein,
                    logged_at=excluded.logged_at
            """, (
                state.user_id, today, meal_label, float(calories),
                float(protein), now.isoformat(),
            ))
        else:
            db.execute("""
                DELETE FROM meal_logs
                WHERE user_id=? AND day=? AND meal_label=?
            """, (state.user_id, today, meal_label))

        rows = db.execute("""
            SELECT meal_label, calories, protein, logged_at
            FROM meal_logs WHERE user_id=? AND day=?
            ORDER BY logged_at
        """, (state.user_id, today)).fetchall()

    state.calories_logged = sum(row["calories"] for row in rows)
    state.protein_logged = sum(row["protein"] for row in rows)
    state.last_meal_time = (
        datetime.fromisoformat(rows[-1]["logged_at"]) if rows else None
    )
    save_state(state)
    return [
        {
            "meal_label": row["meal_label"],
            "calories": row["calories"],
            "protein": row["protein"],
            "logged_at": row["logged_at"],
        }
        for row in rows
    ]


def get_meal_logs(user_id, day=None):
    day = (day or date.today()).isoformat()
    with _connect() as db:
        rows = db.execute("""
            SELECT meal_label, calories, protein, logged_at
            FROM meal_logs WHERE user_id=? AND day=?
            ORDER BY logged_at
        """, (user_id, day)).fetchall()
    return [dict(row) for row in rows]


def add_notification(user_id, trigger, message, now=None):
    created_at = (now or datetime.now()).isoformat()
    with _connect() as db:
        cursor = db.execute("""
            INSERT INTO notifications (user_id, trigger, message, created_at)
            VALUES (?, ?, ?, ?)
        """, (user_id, trigger, message, created_at))
        notification_id = cursor.lastrowid
    return {
        "id": notification_id,
        "trigger": trigger,
        "message": message,
        "created_at": created_at,
    }


def get_notifications(user_id, limit=10):
    with _connect() as db:
        rows = db.execute("""
            SELECT id, trigger, message, created_at
            FROM notifications WHERE user_id=?
            ORDER BY id DESC LIMIT ?
        """, (user_id, int(limit))).fetchall()
    return [dict(row) for row in rows]

