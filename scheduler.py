"""
scheduler.py
The main application. Combines the trained ML models to:
1. Take user task input (text + priority + how much time they have available)
2. Predict category (NLP) and expected duration (regression)
3. Build a day-by-day schedule by picking slots with highest predicted
   completion probability (classifier) that don't conflict
4. Dynamically replan when an urgent task is added - bumps the lowest
   priority / most "flexible" task to free a slot

Run: python3 scheduler.py
Requires trained models (run train_models.py and train_text_classifier.py first)
"""

import joblib
import pandas as pd
from datetime import datetime, timedelta

DURATION_MODEL = joblib.load("/home/claude/project/duration_model.pkl")
COMPLETION_MODEL = joblib.load("/home/claude/project/completion_model.pkl")
TEXT_MODEL = joblib.load("/home/claude/project/text_category_model.pkl")

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
WORK_HOURS = list(range(7, 23))  # 7am - 10pm available slots


class Task:
    def __init__(self, text, priority="medium", estimated_duration=None):
        self.text = text
        self.priority = priority
        self.category = TEXT_MODEL.predict([text])[0]
        self.estimated_duration = estimated_duration or 45
        self.day = None
        self.hour = None
        self.predicted_actual_duration = None
        self.completion_prob = None

    def __repr__(self):
        return (f"[{self.day} {self.hour}:00] {self.text} "
                f"({self.category}, {self.priority}) "
                f"~{self.predicted_actual_duration}min "
                f"success={self.completion_prob:.0%}")


def build_features(task, day, hour, is_weekend):
    return pd.DataFrame([{
        "category": task.category,
        "priority": task.priority,
        "day_of_week": day,
        "hour_slot": hour,
        "estimated_duration": task.estimated_duration,
        "is_weekend": int(is_weekend),
    }])


def score_slot(task, day, hour):
    """Use ML models to score how good a (day, hour) slot is for this task."""
    is_weekend = day in ["Sat", "Sun"]
    feats = build_features(task, day, hour, is_weekend)
    completion_prob = COMPLETION_MODEL.predict_proba(feats)[0][1]
    predicted_duration = DURATION_MODEL.predict(feats)[0]
    return completion_prob, predicted_duration


def find_best_slot(task, calendar, exclude_slots=None):
    """Search all free slots across the week and return the one with
    the highest ML-predicted completion probability."""
    exclude_slots = exclude_slots or set()
    best = None
    for day in DAYS:
        for hour in WORK_HOURS:
            if (day, hour) in calendar or (day, hour) in exclude_slots:
                continue
            prob, dur = score_slot(task, day, hour)
            if best is None or prob > best[0]:
                best = (prob, dur, day, hour)
    return best  # (prob, duration, day, hour) or None


def schedule_tasks(task_list):
    """Greedy scheduling: sort by priority, place each task in its best slot."""
    calendar = {}  # (day, hour) -> Task
    priority_order = {"high": 0, "medium": 1, "low": 2}
    task_list = sorted(task_list, key=lambda t: priority_order[t.priority])

    for task in task_list:
        result = find_best_slot(task, calendar)
        if result is None:
            print(f"  ! No free slot found for: {task.text}")
            continue
        prob, dur, day, hour = result
        task.day, task.hour = day, hour
        task.predicted_actual_duration = int(dur)
        task.completion_prob = prob
        calendar[(day, hour)] = task
    return calendar


def print_calendar(calendar):
    print("\n===== WEEKLY SCHEDULE =====")
    for day in DAYS:
        day_tasks = [t for (d, h), t in sorted(calendar.items()) if d == day]
        if not day_tasks:
            continue
        print(f"\n{day}:")
        for t in sorted(day_tasks, key=lambda x: x.hour):
            print(f"  {t.hour:02d}:00 - {t.text} ({t.category}, {t.priority}) "
                  f"~{t.predicted_actual_duration}min, success={t.completion_prob:.0%}")


def replan_for_urgent_task(urgent_task, calendar):
    """Dynamic replanning: if no free slot exists, bump the lowest-priority
    task from the earliest available slot and reinsert it elsewhere."""
    print(f"\n>>> URGENT TASK ARRIVED: '{urgent_task.text}'")
    result = find_best_slot(urgent_task, calendar)

    if result is not None:
        prob, dur, day, hour = result
        urgent_task.day, urgent_task.hour = day, hour
        urgent_task.predicted_actual_duration = int(dur)
        urgent_task.completion_prob = prob
        calendar[(day, hour)] = urgent_task
        print(f"  Placed directly into free slot: {day} {hour}:00")
        return calendar

    # No free slot -> find the most "flexible" (lowest priority) existing task to bump
    priority_rank = {"low": 0, "medium": 1, "high": 2}
    bumpable = sorted(calendar.items(), key=lambda kv: priority_rank[kv[1].priority])
    if not bumpable:
        print("  Calendar is empty but still no slot found — check WORK_HOURS range.")
        return calendar

    (day, hour), bumped_task = bumpable[0]
    print(f"  No free slot. Bumping lower-priority task: '{bumped_task.text}' "
          f"from {day} {hour}:00")
    del calendar[(day, hour)]

    # Place urgent task in freed slot
    prob, dur = score_slot(urgent_task, day, hour)
    urgent_task.day, urgent_task.hour = day, hour
    urgent_task.predicted_actual_duration = int(dur)
    urgent_task.completion_prob = prob
    calendar[(day, hour)] = urgent_task

    # Reinsert bumped task elsewhere
    new_result = find_best_slot(bumped_task, calendar)
    if new_result:
        prob2, dur2, day2, hour2 = new_result
        bumped_task.day, bumped_task.hour = day2, hour2
        bumped_task.predicted_actual_duration = int(dur2)
        bumped_task.completion_prob = prob2
        calendar[(day2, hour2)] = bumped_task
        print(f"  Rescheduled '{bumped_task.text}' to {day2} {hour2}:00")
    else:
        print(f"  Could not find a new slot for '{bumped_task.text}' — dropped, needs manual reschedule.")

    return calendar


# ---------------- DEMO / MAIN ----------------
if __name__ == "__main__":
    print("=== AI-Powered Productivity Scheduler (Demo) ===\n")

    # Step 1: user's initial tasks/concerns
    user_tasks = [
        Task("finish assignment report", priority="high", estimated_duration=90),
        Task("gym workout", priority="medium", estimated_duration=45),
        Task("team meeting", priority="high", estimated_duration=60),
        Task("grocery shopping", priority="low", estimated_duration=30),
        Task("watch tutorial on machine learning", priority="medium", estimated_duration=50),
        Task("call family", priority="low", estimated_duration=20),
    ]

    calendar = schedule_tasks(user_tasks)
    print_calendar(calendar)

    # Step 2: simulate an urgent task arriving mid-week
    urgent = Task("urgent client presentation prep", priority="high", estimated_duration=60)
    calendar = replan_for_urgent_task(urgent, calendar)

    print_calendar(calendar)
