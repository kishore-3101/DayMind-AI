"""
app.py
FastAPI Web Server for DayMind AI.
Exposes RESTful APIs for task creation, multi-day goal scheduling, dynamic urgent replanning,
NLP live preview, automatic prompt decomposition into sub-tasks, calendar retrieval, and SQLite persistence.
"""

import os
import json
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List

import database as db
import ml_engine as ml

app = FastAPI(
    title="DayMind AI API",
    description="AI-Powered Dynamic Productivity Scheduler API",
    version="1.0.0"
)

# Enable CORS for local dev / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic Schemas
class TaskCreateSchema(BaseModel):
    task_text: str
    priority: Optional[str] = "medium"
    estimated_duration: Optional[int] = 45
    category: Optional[str] = None
    preferred_day: Optional[str] = None
    num_days: Optional[int] = None
    hours_per_day: Optional[float] = None


class UrgentTaskSchema(BaseModel):
    task_text: str
    estimated_duration: Optional[int] = 45
    category: Optional[str] = None
    preferred_day: Optional[str] = None
    num_days: Optional[int] = None
    hours_per_day: Optional[float] = None


class NLPPreviewSchema(BaseModel):
    task_text: str
    num_days: Optional[int] = None
    hours_per_day: Optional[float] = None


class GenerateLearningPlanSchema(BaseModel):
    topic: str
    num_days: int
    hours_per_day: float
    priority: Optional[str] = "medium"
    time_preference: Optional[str] = None


class BatchScheduleSchema(BaseModel):
    topic: str
    priority: Optional[str] = "medium"
    time_preference: Optional[str] = None
    modules: List[dict]


@app.get("/api/health")
def health_check():
    return {"status": "online", "models_loaded": ml.text_model is not None}


@app.post("/api/generate-learning-plan")
def generate_learning_plan(data: GenerateLearningPlanSchema):
    if not data.topic.strip():
        raise HTTPException(status_code=400, detail="Learning topic cannot be empty.")
    
    plan = ml.generate_learning_syllabus(
        topic=data.topic,
        num_days=data.num_days,
        hours_per_day=data.hours_per_day,
        priority=data.priority,
        time_preference=data.time_preference
    )
    return plan


@app.post("/api/tasks/batch")
def batch_schedule_tasks(data: BatchScheduleSchema):
    if not data.modules:
        raise HTTPException(status_code=400, detail="Modules list cannot be empty.")
    
    res = ml.batch_schedule_learning_plan(data.model_dump())
    return res


@app.post("/api/predict-nlp")
def predict_nlp(data: NLPPreviewSchema):
    text = data.task_text.strip()
    if not text:
        return {"category": "personal", "confidence": 0.5}
    cat, conf = ml.predict_category(text)
    
    decomp = None
    if data.num_days and data.num_days > 1 and data.hours_per_day:
        decomp = ml.generate_explicit_multi_day_tasks(text, data.num_days, data.hours_per_day)
    else:
        decomp = ml.parse_task_decomposition(text)

    return {
        "category": cat,
        "confidence": conf,
        "decomposition": decomp
    }


@app.get("/api/tasks")
def get_tasks():
    tasks = db.get_all_tasks()
    return {"tasks": tasks}


@app.post("/api/tasks")
def create_task(data: TaskCreateSchema):
    if not data.task_text.strip():
        raise HTTPException(status_code=400, detail="Task text cannot be empty.")
    
    task_input = data.model_dump()
    result = ml.schedule_new_task(task_input)
    return {"message": "Task scheduled successfully", "result": result, "task": result.get("task")}


@app.post("/api/tasks/urgent")
def create_urgent_task(data: UrgentTaskSchema):
    if not data.task_text.strip():
        raise HTTPException(status_code=400, detail="Urgent task text cannot be empty.")
    
    urgent_input = data.model_dump()
    replan_summary = ml.replan_urgent_task(urgent_input)
    return {"message": "Dynamic replan complete", "replan_summary": replan_summary}


@app.patch("/api/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    db.toggle_task_completed(task_id)
    return {"message": "Task status updated"}


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    db.delete_task(task_id)
    return {"message": "Task deleted"}


@app.post("/api/schedule/rebalance")
def rebalance_schedule():
    updated_tasks = ml.rebalance_full_schedule()
    return {"message": "Schedule rebalanced with ML model optimization", "tasks": updated_tasks}


@app.get("/api/calendar")
def get_calendar(start_date: Optional[str] = None):
    from datetime import datetime, timedelta
    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        except Exception:
            start_dt = today - timedelta(days=today.weekday())
    else:
        start_dt = today - timedelta(days=today.weekday())
    
    dates_list = []
    calendar_grid = {}
    
    for i in range(7):
        cur_dt = start_dt + timedelta(days=i)
        d_str = cur_dt.strftime("%Y-%m-%d")
        dates_list.append({
            "date": d_str,
            "day_name": ml.DAYS[cur_dt.weekday()],
            "formatted": cur_dt.strftime("%b %d"),
            "full_formatted": cur_dt.strftime("%A, %b %d"),
            "day_num": cur_dt.day,
            "is_today": d_str == today_str,
            "is_weekend": cur_dt.weekday() >= 5
        })
        calendar_grid[d_str] = {hour: None for hour in ml.WORK_HOURS}

    tasks = db.get_all_tasks()
    for t in tasks:
        t_date = t.get("task_date") or today_str
        hour = t["hour_slot"]
        if t_date in calendar_grid and hour in calendar_grid[t_date]:
            calendar_grid[t_date][hour] = t

    end_dt = start_dt + timedelta(days=6)
    header_title = f"{start_dt.strftime('%B %d')} – {end_dt.strftime('%B %d, %Y')}"

    return {
        "start_date": start_dt.strftime("%Y-%m-%d"),
        "end_date": end_dt.strftime("%Y-%m-%d"),
        "header_title": header_title,
        "dates": dates_list,
        "days": ml.DAYS,
        "work_hours": ml.WORK_HOURS,
        "calendar": calendar_grid,
        "total_tasks": len(tasks),
        "completed_tasks": len([t for t in tasks if t["completed"] == 1])
    }


@app.get("/api/tasks/by-date")
def get_tasks_by_date(date: str):
    tasks = db.get_tasks_by_date(date)
    return {"date": date, "tasks": tasks}


@app.get("/api/ml-insights")
def get_ml_insights():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    metrics_path = os.path.join(BASE_DIR, "models", "ml_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)
        return metrics
    else:
        return {"error": "ML metrics file not found. Run train_models.py and train_text_classifier.py."}


@app.get("/api/replan-logs")
def get_replan_logs():
    logs = db.get_replan_logs(limit=20)
    return {"logs": logs}


@app.post("/api/seed-demo")
def seed_demo_data():
    db.clear_all_tasks()
    demo_items = [
        {"task_text": "Finish Machine Learning assignment report", "priority": "high", "estimated_duration": 90, "preferred_day": "Tue"},
        {"task_text": "Gym strength workout", "priority": "medium", "estimated_duration": 45, "preferred_day": "Mon"},
        {"task_text": "Weekly project standup meeting", "priority": "high", "estimated_duration": 60, "preferred_day": "Wed"},
        {"task_text": "Grocery shopping & meal prep", "priority": "low", "estimated_duration": 30, "preferred_day": "Sat"},
        {"task_text": "Watch tutorial on Scikit-Learn pipelines", "priority": "medium", "estimated_duration": 50, "preferred_day": "Thu"},
        {"task_text": "Call family & catch up", "priority": "low", "estimated_duration": 25, "preferred_day": "Fri"},
    ]
    scheduled = []
    for item in demo_items:
        res = ml.schedule_new_task(item)
        scheduled.append(res)
        
    return {"message": "Demo data populated", "count": len(scheduled)}


# Serve production static files if dist folder exists
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
