# ⚡ DayMind AI — Machine Learning Productivity Scheduler

DayMind AI is an **AI-powered productivity application** built for a **Machine Learning subject project**. It converts user task concerns into an optimized weekly calendar and day-by-day to-do schedule using 3 trained Machine Learning models and performs **real-time dynamic replanning** whenever an urgent task arrives.

---

## ✨ Features & Architecture

1. **Machine Learning Pipeline (Scikit-Learn)**:
   - **NLP Text Category Classifier**: Uses TF-IDF Vectorization + Logistic Regression to classify raw free-text input into categories (`academic`, `work`, `health`, `personal`, `learning`) with live confidence scoring.
   - **Task Duration Regressor**: RandomForestRegressor predicts realistic completion time in minutes based on category, priority, time slot, and estimated duration.
   - **Slot Completion Evaluator**: RandomForestClassifier evaluates calendar time slots (Mon–Sun, 7:00 AM – 10:00 PM) to maximize task completion probability.

2. **Dynamic Urgent Task Replanning**:
   - When an urgent task arrives, the engine evaluates available free slots.
   - If all slots are full, it identifies lower priority/flexible tasks, **bumps** them from their slot, places the urgent task immediately, and reschedules bumped tasks to alternate free slots with full audit logging.

3. **Glassmorphism Theme UI**:
   - Frosted glass cards, aurora gradients, glowing indicators, category color tags, and priority badges.
   - **Weekly Calendar View**: Hour-by-hour calendar grid with ML completion probability badges (e.g., `89% ML Confidence`).
   - **Day-by-Day To-Do List View**: Chronological checklist with instant completion toggle and category filtering.
   - **ML Evaluation Dashboard Modal**: Shows Logistic Regression accuracy, Random Forest MAE, slot accuracy, feature importances, and dataset statistics for ML course evaluation.

4. **Database & Hosting (Single User)**:
   - Uses **SQLite** (`daymind.db`) for zero-setup, single-user persistent storage.
   - Served via **FastAPI** so backend APIs and static React frontend assets are served on a single port (`8000`).

---

## 🚀 How to Run Locally & Host

### Quick Start (Local)

1. **Activate Environment & Run Server**:
   ```bash
   python3 run_server.py
   ```
   *or using the virtual environment:*
   ```bash
   ./venv/bin/python run_server.py
   ```

2. Open your browser to: **`http://localhost:8000`**

### Re-training ML Models (Optional)
To retrain models from `task_dataset.csv`:
```bash
./venv/bin/python train_models.py
./venv/bin/python train_text_classifier.py
```

---

## 🌐 Hosting & Sharing with Others

Since the app combines FastAPI and pre-built static React assets, you can host it easily:

1. **Free Cloud Platforms (Render / Railway / Hugging Face Spaces / Koyeb)**:
   - Push repository to GitHub.
   - Build Command: `pip install -r requirements.txt && npm install && npm run build`
   - Start Command: `python3 run_server.py`
   - Set Port: `8000`

2. **Local Network Sharing**:
   - Run `python3 run_server.py`.
   - Access from other devices on your Wi-Fi using your local IP (e.g., `http://192.168.x.x:8000`).

---

## 📊 Technical Presentation Summary (For ML Subject Evaluation)

| Component | Technology / Algorithm | Key Performance Metric |
| :--- | :--- | :--- |
| **NLP Classification** | TF-IDF + Logistic Regression | `100.0%` Test Accuracy |
| **Duration Prediction** | RandomForestRegressor (200 trees) | `MAE: 6.15 minutes` |
| **Slot Completion** | RandomForestClassifier (200 trees) | `73.8%` Test Accuracy |
| **Database** | SQLite (`daymind.db`) | Single-user persistence |
| **Frontend** | React 18 + Vite + Glassmorphism | Dark Aurora Theme |
