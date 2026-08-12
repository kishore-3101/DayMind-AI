"""
database.py
SQLite database manager for single-user persistence of tasks, schedule state,
replanning audit logs, and system configuration.
"""

import sqlite3
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "daymind.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_text TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        estimated_duration INTEGER NOT NULL,
        predicted_duration INTEGER NOT NULL,
        completion_prob REAL NOT NULL,
        task_date TEXT NOT NULL DEFAULT '',
        day_of_week TEXT NOT NULL,
        hour_slot INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        is_urgent INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Check for missing columns (Migration)
    cursor.execute("PRAGMA table_info(tasks);")
    columns = [col["name"] for col in cursor.fetchall()]

    if "task_date" not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN task_date TEXT DEFAULT '';")
        # Backfill task_date with current date
        today_str = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("UPDATE tasks SET task_date = ? WHERE task_date IS NULL OR task_date = '';", (today_str,))

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS replan_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        urgent_task_text TEXT NOT NULL,
        bumped_task_text TEXT,
        action_type TEXT NOT NULL,
        description TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """)

    # Default settings
    default_settings = {
        "work_start_hour": "7",
        "work_end_hour": "22",
        "buffer_minutes": "15"
    }
    for k, v in default_settings.items():
        cursor.execute("INSERT OR IGNORE INTO user_settings (key, value) VALUES (?, ?);", (k, v))

    conn.commit()
    conn.close()


def add_task(task_dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    task_date = task_dict.get("task_date") or datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
    INSERT INTO tasks (
        task_text, category, priority, estimated_duration,
        predicted_duration, completion_prob, task_date, day_of_week, hour_slot, completed, is_urgent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        task_dict["task_text"],
        task_dict["category"],
        task_dict["priority"],
        task_dict["estimated_duration"],
        task_dict["predicted_duration"],
        task_dict["completion_prob"],
        task_date,
        task_dict["day_of_week"],
        task_dict["hour_slot"],
        task_dict.get("completed", 0),
        task_dict.get("is_urgent", 0)
    ))
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return task_id


def update_task_slot(task_id, day_of_week, hour_slot, completion_prob=None, predicted_duration=None, task_date=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if task_date:
        if completion_prob is not None and predicted_duration is not None:
            cursor.execute("""
            UPDATE tasks
            SET task_date = ?, day_of_week = ?, hour_slot = ?, completion_prob = ?, predicted_duration = ?
            WHERE id = ?;
            """, (task_date, day_of_week, hour_slot, completion_prob, predicted_duration, task_id))
        else:
            cursor.execute("""
            UPDATE tasks
            SET task_date = ?, day_of_week = ?, hour_slot = ?
            WHERE id = ?;
            """, (task_date, day_of_week, hour_slot, task_id))
    else:
        if completion_prob is not None and predicted_duration is not None:
            cursor.execute("""
            UPDATE tasks
            SET day_of_week = ?, hour_slot = ?, completion_prob = ?, predicted_duration = ?
            WHERE id = ?;
            """, (day_of_week, hour_slot, completion_prob, predicted_duration, task_id))
        else:
            cursor.execute("""
            UPDATE tasks
            SET day_of_week = ?, hour_slot = ?
            WHERE id = ?;
            """, (day_of_week, hour_slot, task_id))
    conn.commit()
    conn.close()


def toggle_task_completed(task_id, completed=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if completed is None:
        cursor.execute("UPDATE tasks SET completed = 1 - completed WHERE id = ?;", (task_id,))
    else:
        cursor.execute("UPDATE tasks SET completed = ? WHERE id = ?;", (int(completed), task_id))
    conn.commit()
    conn.close()


def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?;", (task_id,))
    conn.commit()
    conn.close()


def get_all_tasks():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks ORDER BY task_date ASC, hour_slot ASC;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_tasks_by_date(date_str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE task_date = ? ORDER BY hour_slot ASC;", (date_str,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def clear_all_tasks():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks;")
    conn.commit()
    conn.close()


def log_replan_event(urgent_task_text, bumped_task_text, action_type, description):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO replan_logs (urgent_task_text, bumped_task_text, action_type, description)
    VALUES (?, ?, ?, ?);
    """, (urgent_task_text, bumped_task_text or "", action_type, description))
    conn.commit()
    conn.close()


def get_replan_logs(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM replan_logs ORDER BY timestamp DESC LIMIT ?;", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM user_settings;")
    rows = cursor.fetchall()
    conn.close()
    return {r["key"]: r["value"] for r in rows}


# Initialize DB on module import
init_db()
