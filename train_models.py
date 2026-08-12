"""
train_models.py
Trains two ML models on task_dataset.csv using a 75% Train / 25% Test split:
1. Duration Regressor - predicts actual_duration from task features
2. Completion Classifier - predicts probability a task gets completed in a given slot

Run: python3 train_models.py
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, accuracy_score, classification_report
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "task_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

df = pd.read_csv(DATASET_PATH)

CATEGORICAL = ["category", "priority", "day_of_week"]
NUMERIC = ["hour_slot", "estimated_duration", "is_weekend"]

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
], remainder="passthrough")

# ---------- Model 1: Duration Regressor (75% Train / 25% Test) ----------
X = df[CATEGORICAL + NUMERIC]
y_duration = df["actual_duration"]

X_train, X_test, y_train, y_test = train_test_split(X, y_duration, test_size=0.25, random_state=42)

duration_model = Pipeline([
    ("prep", preprocessor),
    ("model", RandomForestRegressor(n_estimators=200, random_state=42))
])
duration_model.fit(X_train, y_train)
pred = duration_model.predict(X_test)
mae = mean_absolute_error(y_test, pred)
print(f"[Duration Regressor 75/25 Split] MAE: {mae:.2f} minutes (Train: {len(X_train)}, Test: {len(X_test)})")

duration_model_path = os.path.join(MODELS_DIR, "duration_model.pkl")
joblib.dump(duration_model, duration_model_path)

# ---------- Model 2: Completion Classifier (75% Train / 25% Test) ----------
y_completed = df["completed"]
X_train2, X_test2, y_train2, y_test2 = train_test_split(X, y_completed, test_size=0.25, random_state=42)

completion_model = Pipeline([
    ("prep", preprocessor),
    ("model", RandomForestClassifier(n_estimators=200, random_state=42))
])
completion_model.fit(X_train2, y_train2)
pred2 = completion_model.predict(X_test2)
acc = accuracy_score(y_test2, pred2)
print(f"[Completion Classifier 75/25 Split] Accuracy: {acc:.3f} (Train: {len(X_train2)}, Test: {len(X_test2)})")
report_dict = classification_report(y_test2, pred2, output_dict=True)

completion_model_path = os.path.join(MODELS_DIR, "completion_model.pkl")
joblib.dump(completion_model, completion_model_path)

# Feature importances extraction for ML insights
rf_classifier = completion_model.named_steps["model"]
encoder = completion_model.named_steps["prep"].named_transformers_["cat"]
cat_feature_names = list(encoder.get_feature_names_out(CATEGORICAL))
all_feature_names = cat_feature_names + NUMERIC
importances = rf_classifier.feature_importances_
feature_importance_list = sorted(
    [{"feature": name, "importance": float(imp)} for name, imp in zip(all_feature_names, importances)],
    key=lambda x: x["importance"],
    reverse=True
)

# Save metrics summary JSON for frontend presentation panel
metrics = {
    "split_info": {
        "train_percentage": 75,
        "test_percentage": 25,
        "train_samples": len(X_train),
        "test_samples": len(X_test)
    },
    "duration_regressor": {
        "mae_minutes": float(round(mae, 2)),
        "model_type": "RandomForestRegressor(n_estimators=200)",
        "train_samples": len(X_train),
        "test_samples": len(y_test)
    },
    "completion_classifier": {
        "accuracy": float(round(acc, 4)),
        "precision": float(round(report_dict["weighted avg"]["precision"], 4)),
        "recall": float(round(report_dict["weighted avg"]["recall"], 4)),
        "f1_score": float(round(report_dict["weighted avg"]["f1-score"], 4)),
        "model_type": "RandomForestClassifier(n_estimators=200)",
        "train_samples": len(X_train2),
        "test_samples": len(y_test2)
    },
    "dataset": {
        "total_samples": len(df),
        "categories": list(df["category"].unique()),
        "priorities": list(df["priority"].unique())
    },
    "feature_importances": feature_importance_list
}

metrics_path = os.path.join(MODELS_DIR, "ml_metrics.json")
with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\nModels & metrics saved in: {MODELS_DIR}")
