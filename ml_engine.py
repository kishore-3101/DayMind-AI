"""
ml_engine.py
Core Machine Learning Engine for DayMind AI.
Handles NLP task classification, Random Forest duration prediction,
slot probability evaluation, greedy calendar placement, dynamic urgent replanning,
and automatic multi-day learning plan decomposition (e.g. Learn Java in 20 days -> 20 daily slots).
"""

import os
import re
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import database as db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

TEXT_MODEL_PATH = os.path.join(MODELS_DIR, "text_category_model.pkl")
DURATION_MODEL_PATH = os.path.join(MODELS_DIR, "duration_model.pkl")
COMPLETION_MODEL_PATH = os.path.join(MODELS_DIR, "completion_model.pkl")

# Load models gracefully
try:
    text_model = joblib.load(TEXT_MODEL_PATH)
    duration_model = joblib.load(DURATION_MODEL_PATH)
    completion_model = joblib.load(COMPLETION_MODEL_PATH)
    print("[ML Engine] All models loaded successfully.")
except Exception as e:
    print(f"[ML Engine ERROR] Could not load ML models: {e}")
    text_model = None
    duration_model = None
    completion_model = None

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
WORK_HOURS = list(range(7, 23))  # 7:00 AM to 10:00 PM


def get_current_day_str():
    now = datetime.now()
    return DAYS[now.weekday()]


def get_tomorrow_day_str():
    now = datetime.now()
    return DAYS[(now.weekday() + 1) % 7]


def predict_category(task_text):
    """NLP Text Classification using TF-IDF + Logistic Regression."""
    if not text_model:
        return "learning" if "learn" in task_text.lower() else "personal", 0.5
    try:
        category = text_model.predict([task_text])[0]
        probs = text_model.predict_proba([task_text])[0]
        confidence = float(max(probs))
        return category, round(confidence, 3)
    except Exception as e:
        print(f"NLP error: {e}")
        return "learning" if "learn" in task_text.lower() else "personal", 0.5


def build_features(category, priority, day, hour, estimated_duration):
    is_weekend = int(day in ["Sat", "Sun"])
    return pd.DataFrame([{
        "category": category,
        "priority": priority,
        "day_of_week": day,
        "hour_slot": int(hour),
        "estimated_duration": int(estimated_duration),
        "is_weekend": is_weekend
    }])


def score_slot(category, priority, day, hour, estimated_duration):
    """Use Random Forest models to evaluate a candidate slot."""
    if not completion_model or not duration_model:
        return 0.75, estimated_duration
    
    feats = build_features(category, priority, day, hour, estimated_duration)
    try:
        completion_prob = float(completion_model.predict_proba(feats)[0][1])
        predicted_duration = float(duration_model.predict(feats)[0])
        return round(completion_prob, 3), int(round(predicted_duration))
    except Exception as e:
        print(f"Scoring error: {e}")
        return 0.75, estimated_duration


def find_best_slot(category, priority, estimated_duration, occupied_calendar, preferred_day=None):
    """
    Evaluates all free slots in WORK_HOURS across DAYS.
    Returns (completion_prob, predicted_duration, day, hour).
    """
    best = None
    days_to_check = DAYS
    if preferred_day and preferred_day in DAYS:
        days_to_check = [preferred_day] + [d for d in DAYS if d != preferred_day]

    for day in days_to_check:
        for hour in WORK_HOURS:
            if (day, hour) in occupied_calendar:
                continue
            prob, dur = score_slot(category, priority, day, hour, estimated_duration)
            if best is None or prob > best[0]:
                best = (prob, dur, day, hour)
                
    return best  # (prob, dur, day, hour) or None


def parse_task_decomposition(prompt_text):
    """
    AI NLP Prompt Parsing Engine:
    Detects if prompt specifies multi-day learning goals (e.g. learn Java in next 20 days)
    or multi-chapter requirements (e.g. 5 chapters 1 hour each).
    """
    if not prompt_text or len(prompt_text.strip()) < 4:
        return None

    prompt_lower = prompt_text.lower()

    # 1. Multi-Day Learning Plan pattern (e.g. learn java in next 20 days)
    day_plan_match = re.search(r'(?:in\s*(?:the\s*)?next|for|over)\s*(\d+)\s*days?\b|(\d+)\s*days?\s*(?:plan|course|challenge|goal)', prompt_lower)
    
    # 2. Count patterns (e.g. 5 chapters, 4 modules, 3 slots)
    count_match = re.search(r'(\d+)\s*(chapters?|modules?|parts?|topics?|sections?|units?|slots?|sessions?|tasks?)\b', prompt_lower)
    
    # 3. Duration patterns (e.g. 1 hour, 30 mins, 2 hours)
    hour_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b', prompt_lower)
    min_match = re.search(r'(\d+)\s*(?:mins?|minutes?)\b', prompt_lower)

    duration = 60  # Default 60 minutes
    if hour_match:
        duration = int(float(hour_match.group(1)) * 60)
    elif min_match:
        duration = int(min_match.group(1))

    # Case A: Multi-Day Learning Goal (e.g. learn java in next 20 days)
    if day_plan_match:
        num_days = int(day_plan_match.group(1) or day_plan_match.group(2))
        if num_days > 0:
            topic = prompt_text
            topic = re.sub(r'(?:i\s+need\s+to\s+|i\s+want\s+to\s+)', '', topic, flags=re.IGNORECASE)
            topic = re.sub(r'\s*(?:in\s*(?:the\s*)?next|for|over)\s*\d+\s*days.*', '', topic, flags=re.IGNORECASE)
            topic = re.sub(r'\s*\d+\s*days?\s*(?:plan|course|challenge|goal).*', '', topic, flags=re.IGNORECASE)
            topic = topic.strip(' ,.!')
            if not topic:
                topic = "Learning Goal"

            subtasks = []
            now = datetime.now()
            for i in range(1, num_days + 1):
                target_date = now + timedelta(days=i-1)
                target_day = DAYS[target_date.weekday()]
                subtasks.append({
                    "task_text": f"{topic} - Day {i}",
                    "estimated_duration": duration,
                    "priority": "medium",
                    "preferred_day": target_day,
                    "unit_type": "Day",
                    "index": i,
                    "total_count": num_days
                })

            return {
                "type": "multi_day",
                "count": num_days,
                "unit_type": "Day",
                "duration": duration,
                "topic": topic,
                "subtasks": subtasks
            }

    # Case B: Multi-Chapter / Multi-Slot decomposition (e.g. 5 chapters 1 hour each)
    if count_match:
        count = int(count_match.group(1))
        if count > 1:
            unit_raw = count_match.group(2)
            unit_type = unit_raw.rstrip('s').capitalize()
            if unit_type in ['Slot', 'Session']:
                unit_type = 'Part'

            has_tomorrow = 'tomorrow' in prompt_lower
            target_day = get_tomorrow_day_str() if has_tomorrow else None

            is_high = any(w in prompt_lower for w in ['exam', 'test', 'urgent', 'tomorrow', 'quiz', 'deadline'])
            priority = 'high' if is_high else 'medium'

            topic = prompt_text
            topic = re.sub(r'split\s+it\s+into.*', '', topic, flags=re.IGNORECASE)
            topic = re.sub(r'with\s+\d+.*', '', topic, flags=re.IGNORECASE)
            topic = re.sub(r'i\s+have\s+', '', topic, flags=re.IGNORECASE)
            topic = re.sub(r'\btomorrow\b', '', topic, flags=re.IGNORECASE)
            topic = topic.strip(' ,.!')
            if not topic:
                topic = "Exam Prep"

            subtasks = []
            for i in range(1, count + 1):
                subtasks.append({
                    "task_text": f"{topic} - {unit_type} {i}",
                    "estimated_duration": duration,
                    "priority": priority,
                    "preferred_day": target_day,
                    "unit_type": unit_type,
                    "index": i,
                    "total_count": count
                })

            return {
                "type": "multi_chapter",
                "count": count,
                "unit_type": unit_type,
                "duration": duration,
                "topic": topic,
                "subtasks": subtasks
            }

    return None


def generate_explicit_multi_day_tasks(topic, num_days, hours_per_day, priority="medium"):
    """
    Generates multi-day subtasks based on explicit user form inputs.
    """
    duration = int(float(hours_per_day) * 60)
    topic_clean = topic.strip() or "Learning Goal"
    
    subtasks = []
    now = datetime.now()
    for i in range(1, num_days + 1):
        target_date = now + timedelta(days=i-1)
        target_day = DAYS[target_date.weekday()]
        subtasks.append({
            "task_text": f"{topic_clean} - Day {i}",
            "estimated_duration": duration,
            "priority": priority,
            "preferred_day": target_day,
            "unit_type": "Day",
            "index": i,
            "total_count": num_days
        })
        
    return {
        "type": "multi_day",
        "count": num_days,
        "unit_type": "Day",
        "duration": duration,
        "topic": topic_clean,
        "subtasks": subtasks
    }


def generate_learning_syllabus(topic, num_days, hours_per_day, priority="medium", time_preference=None):
    """
    Generates a structured, day-by-day learning curriculum tailored to the topic, number of days, and daily hours.
    Calculates total hours, target finish date, and individual daily module titles.
    """
    num_days = max(1, int(num_days))
    hours_per_day = max(0.5, float(hours_per_day))
    duration_mins = int(hours_per_day * 60)
    topic_clean = topic.strip() or "Learning Goal"
    topic_lower = topic_clean.lower()

    # Pre-defined domain syllabi templates
    java_curriculum = [
        "Java Setup, JDK & 'Hello World' Syntax",
        "Variables, Primitive Data Types & Operators",
        "Control Flow: If-Else & Switch Statements",
        "Loops: For, While & Loop Control",
        "Methods, Function Parameters & Return Values",
        "Object-Oriented Programming (OOP) Fundamentals",
        "Classes, Objects & Constructors",
        "Encapsulation & Access Modifiers",
        "Inheritance & Method Overriding",
        "Polymorphism & Abstraction",
        "Interfaces & Abstract Classes",
        "String Handling & StringBuilder",
        "Exception Handling with Try-Catch-Finally",
        "Arrays & Array Manipulations",
        "Collections: ArrayList, LinkedList & Iterators",
        "Sets & Maps (HashSet, HashMap)",
        "Generics, Enums & Wrapper Classes",
        "File I/O & Stream Processing",
        "Java 8+ Lambdas & Functional Interfaces",
        "Stream API & Data Pipeline Processing",
        "Multithreading & Concurrency Basics",
        "Unit Testing with JUnit 5",
        "Build Tools: Maven / Gradle Basics",
        "Design Patterns (Singleton, Factory)",
        "Capstone Java Project Development",
        "Refactoring, Testing & Project Review"
    ]

    python_curriculum = [
        "Python Setup, Syntax & Interactive REPL",
        "Variables, Expressions & Dynamic Typing",
        "List & Tuple Data Structures",
        "Dictionary & Set Manipulations",
        "Conditionals & Boolean Logic",
        "For Loops, While Loops & Comprehensions",
        "Functions, Arguments & Scope",
        "Lambda Functions & Higher-Order Methods",
        "Modules, Packages & Virtual Environments",
        "File I/O & Handling Text / JSON Files",
        "OOP: Classes, Attributes & Methods",
        "OOP: Inheritance & Special Methods",
        "Error Handling & Exception Management",
        "Working with Standard Libraries (os, sys, math)",
        "HTTP Requests & API Consumption",
        "Working with Pandas & DataFrames",
        "Data Visualization with Matplotlib/Seaborn",
        "Decorators, Generators & Iterators",
        "Unit Testing with pytest",
        "Capstone Python Application & Review"
    ]

    react_curriculum = [
        "React Fundamentals, JSX & Vite Setup",
        "Components, Props & Component Trees",
        "State Management with useState",
        "Handling User Input & Form State",
        "Conditional Rendering & Dynamic Lists",
        "Component Lifecycle & useEffect Hook",
        "Fetching Data from REST APIs",
        "Styling in React (Tailwind & CSS Modules)",
        "Custom React Hooks Creation",
        "Context API for Global State",
        "Single-Page Routing with React Router",
        "Form Validation & User Feedback",
        "Performance Optimization (useMemo, useCallback)",
        "Error Boundaries & Testing React Components",
        "Building & Deploying React Web Apps"
    ]

    dsa_curriculum = [
        "Algorithm Analysis & Big-O Notation",
        "Array Manipulations & Two-Pointer Technique",
        "Sliding Window Pattern Problems",
        "Strings, Pattern Matching & Hash Maps",
        "Recursion Fundamentals & Call Stack",
        "Linked Lists: Singly & Doubly Linked",
        "Stacks & Queues Implementation & Applications",
        "Binary Search & Search Space Reduction",
        "Binary Trees & Traversal Algorithms",
        "Binary Search Trees (BST) & Operations",
        "Heap Data Structure & Priority Queues",
        "Graphs Representation (Adjacency Matrix/List)",
        "Graph Traversals: BFS & DFS",
        "Dynamic Programming: 1D DP Problems",
        "Dynamic Programming: 2D DP Patterns",
        "Greedy Algorithms & Backtracking",
        "Capstone Coding Assessment & Review"
    ]

    # Select base curriculum pool
    if "java" in topic_lower and "javascript" not in topic_lower:
        pool = java_curriculum
    elif "python" in topic_lower:
        pool = python_curriculum
    elif "react" in topic_lower:
        pool = react_curriculum
    elif any(k in topic_lower for k in ["dsa", "data structure", "algorithm"]):
        pool = dsa_curriculum
    else:
        pool = [
            f"Introduction, Environment Setup & Overview of {topic_clean}",
            f"Core Syntax & Basic Constructs of {topic_clean}",
            f"Data Structures & Variable Scoping in {topic_clean}",
            f"Control Flow & Conditional Logic in {topic_clean}",
            f"Functions, Modules & Reusable Code in {topic_clean}",
            f"Object-Oriented & Structural Patterns in {topic_clean}",
            f"Error Handling, Debugging & Logging in {topic_clean}",
            f"Working with File Systems & External Libraries",
            f"API Integration & Data Processing in {topic_clean}",
            f"Intermediate Concepts & Best Practices for {topic_clean}",
            f"State Management & Logic Architecture in {topic_clean}",
            f"Testing & Code Quality Assurance for {topic_clean}",
            f"Performance Optimization & Code Refactoring",
            f"Mini-Project Architecture & Hands-on Implementation",
            f"Capstone Project Development & Deployment for {topic_clean}",
            f"Comprehensive Review & Skill Mastery Assessment"
        ]

    modules = []
    now = datetime.now()
    cat, conf = predict_category(topic_clean)

    for i in range(1, num_days + 1):
        target_date = now + timedelta(days=i-1)
        day_str = DAYS[target_date.weekday()]
        task_date_str = target_date.strftime("%Y-%m-%d")
        
        # Pick topic title from pool or generate
        if i - 1 < len(pool):
            title = f"{topic_clean} Day {i}: {pool[i-1]}"
        else:
            title = f"{topic_clean} Day {i}: Advanced Practice & Application Module {i}"

        modules.append({
            "day_number": i,
            "title": title,
            "task_date": task_date_str,
            "target_day": day_str,
            "target_date_str": target_date.strftime("%b %d"),
            "estimated_duration": duration_mins,
            "hours_per_day": hours_per_day,
            "priority": priority,
            "category": cat
        })

    total_hours = round(num_days * hours_per_day, 1)
    target_finish_date = (now + timedelta(days=num_days-1)).strftime("%A, %b %d, %Y")

    return {
        "topic": topic_clean,
        "num_days": num_days,
        "hours_per_day": hours_per_day,
        "total_hours": total_hours,
        "duration_mins": duration_mins,
        "priority": priority,
        "time_preference": time_preference or "Auto (ML Best)",
        "target_finish_date": target_finish_date,
        "category": cat,
        "confidence": conf,
        "modules": modules
    }


def batch_schedule_learning_plan(plan_data):
    """
    Schedules an entire multi-day learning syllabus into the calendar using ML optimization.
    Maps each day to its exact calendar date (YYYY-MM-DD).
    Respects preferred time slots (Morning, Afternoon, Evening, Night) if provided.
    """
    topic = plan_data.get("topic", "Learning Plan").strip()
    modules = plan_data.get("modules", [])
    priority = plan_data.get("priority", "medium")
    time_pref = plan_data.get("time_preference", "").lower()

    # Map time preference to target hour window
    preferred_hours = WORK_HOURS
    if "morning" in time_pref:
        preferred_hours = [7, 8, 9, 10, 11]
    elif "afternoon" in time_pref:
        preferred_hours = [12, 13, 14, 15, 16]
    elif "evening" in time_pref:
        preferred_hours = [17, 18, 19, 20]
    elif "night" in time_pref:
        preferred_hours = [20, 21, 22]

    scheduled_results = []
    now = datetime.now()
    
    for idx, mod in enumerate(modules):
        task_title = mod.get("title") or f"{topic} - Day {mod.get('day_number', idx+1)}"
        duration = int(mod.get("estimated_duration", 60))
        
        task_date = mod.get("task_date") or (now + timedelta(days=idx)).strftime("%Y-%m-%d")
        try:
            date_obj = datetime.strptime(task_date, "%Y-%m-%d")
            target_day = DAYS[date_obj.weekday()]
        except Exception:
            target_day = "Mon"

        cat = mod.get("category", "learning")

        existing_tasks = db.get_all_tasks()
        occupied = {(t.get("task_date") or "", t["hour_slot"]): t for t in existing_tasks}

        # Try finding best slot within preferred hours window on the specific task_date
        best_slot = None
        for hour in preferred_hours:
            if (task_date, hour) not in occupied:
                prob, dur = score_slot(cat, priority, target_day, hour, duration)
                if best_slot is None or prob > best_slot[0]:
                    best_slot = (prob, dur, target_day, hour)

        # Fallback to any open slot on task_date
        if best_slot is None:
            for hour in WORK_HOURS:
                if (task_date, hour) not in occupied:
                    prob, dur = score_slot(cat, priority, target_day, hour, duration)
                    if best_slot is None or prob > best_slot[0]:
                        best_slot = (prob, dur, target_day, hour)

        if best_slot is not None:
            prob, dur, slot_day, slot_hour = best_slot
        else:
            prob, dur, slot_day, slot_hour = 0.75, duration, target_day, 9

        task_dict = {
            "task_text": task_title,
            "category": cat,
            "priority": priority,
            "estimated_duration": duration,
            "predicted_duration": dur,
            "completion_prob": prob,
            "task_date": task_date,
            "day_of_week": slot_day,
            "hour_slot": slot_hour,
            "completed": 0,
            "is_urgent": 0
        }
        
        task_id = db.add_task(task_dict)
        task_dict["id"] = task_id
        scheduled_results.append(task_dict)

    return {
        "message": f"Successfully scheduled {len(scheduled_results)}-day learning plan for '{topic}'",
        "topic": topic,
        "count": len(scheduled_results),
        "scheduled_tasks": scheduled_results
    }


def schedule_new_task(task_input):
    """
    Processes user input. Supports:
    1. Explicit multi-day input (num_days & hours_per_day specified).
    2. Prompt regex decomposition (multi-day or multi-chapter).
    3. Single task scheduling.
    """
    task_text = task_input.get("task_text", "").strip()
    priority = task_input.get("priority", "medium")
    estimated_duration = int(task_input.get("estimated_duration", 45))
    preferred_day = task_input.get("preferred_day", None)
    task_date = task_input.get("task_date") or datetime.now().strftime("%Y-%m-%d")

    # Check explicit multi-day form parameters
    num_days = task_input.get("num_days")
    hours_per_day = task_input.get("hours_per_day")

    decomp = None
    if num_days and int(num_days) > 1 and hours_per_day:
        decomp = generate_explicit_multi_day_tasks(task_text, int(num_days), float(hours_per_day), priority)
    else:
        decomp = parse_task_decomposition(task_text)

    if decomp and decomp["subtasks"]:
        scheduled_subtasks = []
        for idx, sub in enumerate(decomp["subtasks"]):
            sub_date = (datetime.now() + timedelta(days=idx)).strftime("%Y-%m-%d")
            sub_res = _schedule_single_task({
                "task_text": sub["task_text"],
                "priority": sub.get("priority", priority),
                "estimated_duration": sub.get("estimated_duration", estimated_duration),
                "preferred_day": sub.get("preferred_day") or preferred_day,
                "task_date": sub_date,
                "category": task_input.get("category"),
                "is_urgent": 0
            })
            scheduled_subtasks.append(sub_res)
            
        return {
            "is_decomposed": True,
            "count": len(scheduled_subtasks),
            "topic": decomp["topic"],
            "tasks": scheduled_subtasks,
            "task": scheduled_subtasks[0]
        }

    # Standard single task scheduling
    res = _schedule_single_task(task_input)
    return {
        "is_decomposed": False,
        "count": 1,
        "tasks": [res],
        "task": res
    }


def _schedule_single_task(task_input):
    task_text = task_input.get("task_text", "").strip()
    priority = task_input.get("priority", "medium")
    estimated_duration = int(task_input.get("estimated_duration", 45))
    preferred_day = task_input.get("preferred_day", None)
    task_date = task_input.get("task_date") or datetime.now().strftime("%Y-%m-%d")

    nlp_cat, confidence = predict_category(task_text)
    category = task_input.get("category") or nlp_cat

    existing_tasks = db.get_all_tasks()
    occupied = {(t.get("task_date") or "", t["hour_slot"]): t for t in existing_tasks}

    try:
        date_obj = datetime.strptime(task_date, "%Y-%m-%d")
        target_day = DAYS[date_obj.weekday()]
    except Exception:
        target_day = preferred_day or "Mon"

    best_slot = None
    for hour in WORK_HOURS:
        if (task_date, hour) not in occupied:
            prob, dur = score_slot(category, priority, target_day, hour, estimated_duration)
            if best_slot is None or prob > best_slot[0]:
                best_slot = (prob, dur, target_day, hour)

    if best_slot is None:
        prob, dur = 0.5, estimated_duration
        day, hour = target_day, 9
    else:
        prob, dur, day, hour = best_slot

    task_dict = {
        "task_text": task_text,
        "category": category,
        "priority": priority,
        "estimated_duration": estimated_duration,
        "predicted_duration": dur,
        "completion_prob": prob,
        "task_date": task_date,
        "day_of_week": day,
        "hour_slot": hour,
        "completed": 0,
        "is_urgent": task_input.get("is_urgent", 0)
    }

    task_id = db.add_task(task_dict)
    task_dict["id"] = task_id
    task_dict["nlp_confidence"] = confidence
    return task_dict


def replan_urgent_task(urgent_input):
    """
    Dynamic Urgent Replanning with multi-task / multi-day decomposition support.
    """
    task_text = urgent_input.get("task_text", "").strip()
    num_days = urgent_input.get("num_days")
    hours_per_day = urgent_input.get("hours_per_day")

    if num_days and int(num_days) > 1 and hours_per_day:
        decomp = generate_explicit_multi_day_tasks(task_text, int(num_days), float(hours_per_day), "high")
    else:
        decomp = parse_task_decomposition(task_text)

    if decomp and decomp["subtasks"]:
        all_replan_summaries = []
        for sub in decomp["subtasks"]:
            sub_res = _replan_single_urgent_task({
                "task_text": sub["task_text"],
                "estimated_duration": sub["estimated_duration"],
                "preferred_day": sub.get("preferred_day") or urgent_input.get("preferred_day"),
                "category": urgent_input.get("category")
            })
            all_replan_summaries.append(sub_res)
            
        desc = f"Urgent multi-day plan automatically scheduled across {len(decomp['subtasks'])} days for '{decomp['topic']}'."
        return {
            "urgent_task": all_replan_summaries[0].get("urgent_task"),
            "action_type": "decomposed_urgent_replanning",
            "bumped_task": all_replan_summaries[0].get("bumped_task"),
            "description": desc,
            "all_summaries": all_replan_summaries
        }

    return _replan_single_urgent_task(urgent_input)


def _replan_single_urgent_task(urgent_input):
    task_text = urgent_input.get("task_text", "").strip()
    priority = "high"
    estimated_duration = int(urgent_input.get("estimated_duration", 45))
    preferred_day = urgent_input.get("preferred_day", None)

    nlp_cat, confidence = predict_category(task_text)
    category = urgent_input.get("category") or nlp_cat

    existing_tasks = db.get_all_tasks()
    occupied = {(t["day_of_week"], t["hour_slot"]): t for t in existing_tasks}

    best_slot = find_best_slot(category, priority, estimated_duration, occupied, preferred_day=preferred_day)

    replan_summary = {
        "urgent_task": None,
        "action_type": "",
        "bumped_task": None,
        "description": ""
    }

    if best_slot is not None:
        prob, dur, day, hour = best_slot
        urgent_dict = {
            "task_text": task_text,
            "category": category,
            "priority": priority,
            "estimated_duration": estimated_duration,
            "predicted_duration": dur,
            "completion_prob": prob,
            "day_of_week": day,
            "hour_slot": hour,
            "completed": 0,
            "is_urgent": 1
        }
        task_id = db.add_task(urgent_dict)
        urgent_dict["id"] = task_id
        
        desc = f"Urgent task '{task_text}' placed directly into free ML slot: {day} at {hour:02d}:00."
        db.log_replan_event(task_text, "", "direct_placement", desc)
        
        replan_summary["urgent_task"] = urgent_dict
        replan_summary["action_type"] = "direct_placement"
        replan_summary["description"] = desc
        return replan_summary

    # No free slot -> Bumping
    priority_weights = {"low": 0, "medium": 1, "high": 2}
    bumpable = [t for t in existing_tasks if t["is_urgent"] == 0 and t["completed"] == 0]
    bumpable.sort(key=lambda t: (priority_weights.get(t["priority"], 1), t["completion_prob"]))

    if not bumpable:
        bumpable = [t for t in existing_tasks if t["completed"] == 0]

    target_bump = bumpable[0]
    bumped_day = target_bump["day_of_week"]
    bumped_hour = target_bump["hour_slot"]

    u_prob, u_dur = score_slot(category, priority, bumped_day, bumped_hour, estimated_duration)
    
    urgent_dict = {
        "task_text": task_text,
        "category": category,
        "priority": priority,
        "estimated_duration": estimated_duration,
        "predicted_duration": u_dur,
        "completion_prob": u_prob,
        "day_of_week": bumped_day,
        "hour_slot": bumped_hour,
        "completed": 0,
        "is_urgent": 1
    }
    urgent_id = db.add_task(urgent_dict)
    urgent_dict["id"] = urgent_id

    occupied_new = {(t["day_of_week"], t["hour_slot"]): t for t in existing_tasks if t["id"] != target_bump["id"]}
    occupied_new[(bumped_day, bumped_hour)] = urgent_dict

    rescheduled_slot = find_best_slot(
        target_bump["category"],
        target_bump["priority"],
        target_bump["estimated_duration"],
        occupied_new
    )

    if rescheduled_slot:
        r_prob, r_dur, new_day, new_hour = rescheduled_slot
        db.update_task_slot(target_bump["id"], new_day, new_hour, r_prob, r_dur)
        target_bump["day_of_week"] = new_day
        target_bump["hour_slot"] = new_hour
        target_bump["completion_prob"] = r_prob
        target_bump["predicted_duration"] = r_dur
        
        desc = (f"Urgent task '{task_text}' placed at {bumped_day} {bumped_hour:02d}:00. "
                f"Bumped lower-priority task '{target_bump['task_text']}' to {new_day} {new_hour:02d}:00.")
        action_type = "bumped_and_rescheduled"
    else:
        desc = (f"Urgent task '{task_text}' placed at {bumped_day} {bumped_hour:02d}:00. "
                f"Task '{target_bump['task_text']}' was bumped to backlog.")
        action_type = "bumped_to_backlog"

    db.log_replan_event(task_text, target_bump["task_text"], action_type, desc)

    replan_summary["urgent_task"] = urgent_dict
    replan_summary["bumped_task"] = target_bump
    replan_summary["action_type"] = action_type
    replan_summary["description"] = desc
    return replan_summary


def rebalance_full_schedule():
    """
    Re-optimizes slots for all pending tasks using current ML models.
    """
    tasks = db.get_all_tasks()
    pending = [t for t in tasks if t["completed"] == 0]
    
    p_weights = {"high": 3, "medium": 2, "low": 1}
    pending.sort(key=lambda t: (t["is_urgent"], p_weights.get(t["priority"], 2)), reverse=True)

    occupied = {}
    for task in pending:
        slot = find_best_slot(task["category"], task["priority"], task["estimated_duration"], occupied)
        if slot:
            prob, dur, day, hour = slot
            db.update_task_slot(task["id"], day, hour, prob, dur)
            occupied[(day, hour)] = task
    return db.get_all_tasks()
