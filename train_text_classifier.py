"""
train_text_classifier.py
Trains an NLP text classifier on task_dataset.csv using 75% Train / 25% Test split.

Run: python3 train_text_classifier.py
"""

import os
import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "task_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

df = pd.read_csv(DATASET_PATH)

X = df["task_text"]
y = df["category"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

text_clf = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression(max_iter=1000))
])
text_clf.fit(X_train, y_train)

pred = text_clf.predict(X_test)
acc = accuracy_score(y_test, pred)
print(f"[Text Category Classifier 75/25 Split] Accuracy: {acc:.3f} (Train: {len(X_train)}, Test: {len(X_test)})")
report_dict = classification_report(y_test, pred, output_dict=True)

text_model_path = os.path.join(MODELS_DIR, "text_category_model.pkl")
joblib.dump(text_clf, text_model_path)
print(f"Saved: {text_model_path}")

# Update ml_metrics.json with NLP model stats
metrics_path = os.path.join(MODELS_DIR, "ml_metrics.json")
if os.path.exists(metrics_path):
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
else:
    metrics = {}

metrics["text_classifier"] = {
    "accuracy": float(round(acc, 4)),
    "precision": float(round(report_dict["weighted avg"]["precision"], 4)),
    "recall": float(round(report_dict["weighted avg"]["recall"], 4)),
    "f1_score": float(round(report_dict["weighted avg"]["f1-score"], 4)),
    "model_type": "TfidfVectorizer + LogisticRegression",
    "train_samples": len(X_train),
    "test_samples": len(y_test)
}

with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)

print("NLP metrics saved.")
