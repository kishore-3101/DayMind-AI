import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import roc_curve, auc, confusion_matrix

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "task_dataset.csv")

# Project folder evaluated_images
PROJECT_EVAL_DIR = os.path.join(BASE_DIR, "evaluated_images")
os.makedirs(PROJECT_EVAL_DIR, exist_ok=True)

# Artifact directory evaluated_images
ARTIFACTS_DIR = "/home/kishore/.gemini/antigravity-ide/brain/facf97bb-5948-4c5c-a154-a61139f7de60"
ARTIFACT_EVAL_DIR = os.path.join(ARTIFACTS_DIR, "evaluated_images")
os.makedirs(ARTIFACT_EVAL_DIR, exist_ok=True)

def save_dual_figure(fig, filename):
    p1 = os.path.join(PROJECT_EVAL_DIR, filename)
    p2 = os.path.join(ARTIFACT_EVAL_DIR, filename)
    fig.savefig(p1, dpi=300, bbox_inches='tight')
    fig.savefig(p2, dpi=300, bbox_inches='tight')
    print(f"Saved: {p1} AND {p2}")
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 11

df = pd.read_csv(DATASET_PATH)

CATEGORICAL = ["category", "priority", "day_of_week"]
NUMERIC = ["hour_slot", "estimated_duration", "is_weekend"]

X = df[CATEGORICAL + NUMERIC]
y = df["completed"]

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
], remainder="passthrough")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# Preprocess features
X_train_prep = preprocessor.fit_transform(X_train)
X_test_prep = preprocessor.transform(X_test)

# Train Candidate Algorithms
rf_model = RandomForestClassifier(n_estimators=200, random_state=42).fit(X_train_prep, y_train)
lr_model = LogisticRegression(max_iter=1000, random_state=42).fit(X_train_prep, y_train)
dt_model = DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_train_prep, y_train)
nb_model = GaussianNB().fit(X_train_prep, y_train)

models = {
    "Random Forest (Our Choice)": rf_model,
    "Logistic Regression": lr_model,
    "Decision Tree": dt_model,
    "Naive Bayes": nb_model
}

# Colors for models
colors = {
    "Random Forest (Our Choice)": "#8b5cf6", # Purple
    "Logistic Regression": "#3b82f6",      # Blue
    "Decision Tree": "#f59e0b",            # Amber
    "Naive Bayes": "#ef4444"              # Red
}

# --- 1. ROC CURVES COMPARISON CHART ---
fig, ax = plt.subplots(figsize=(9, 6.5), dpi=300)

for name, model in models.items():
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_test_prep)[:, 1]
    else:
        probs = model.decision_function(X_test_prep)
        
    fpr, tpr, _ = roc_curve(y_test, probs)
    roc_auc = auc(fpr, tpr)
    
    lw = 2.5 if "Random Forest" in name else 1.8
    ls = '-' if "Random Forest" in name else '--'
    ax.plot(fpr, tpr, color=colors[name], lw=lw, linestyle=ls,
            label=f'{name} (AUC = {roc_auc:.3f})')

# Random Chance Line
ax.plot([0, 1], [0, 1], color='#94a3b8', lw=1.5, linestyle=':', label='Random Chance Baseline (AUC = 0.500)')

ax.set_xlim([-0.02, 1.02])
ax.set_ylim([-0.02, 1.02])
ax.set_xlabel('False Positive Rate (1 - Specificity)', fontsize=12, fontweight='bold', labelpad=10)
ax.set_ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=12, fontweight='bold', labelpad=10)
ax.set_title('Receiver Operating Characteristic (ROC) Curve Comparison\nTask Completion Prediction Model', fontsize=14, fontweight='bold', pad=15)
ax.legend(loc="lower right", frameon=True, facecolor='#1e293b', edgecolor='#475569', labelcolor='white', fontsize=10)
ax.set_facecolor('#0f172a')
fig.patch.set_facecolor('#0f172a')
ax.tick_params(colors='white')
ax.xaxis.label.set_color('white')
ax.yaxis.label.set_color('white')
ax.title.set_color('white')
ax.grid(True, linestyle='--', alpha=0.3)

plt.tight_layout()
save_dual_figure(fig, "roc_curve_comparison.png")
plt.close()


# --- 2. CONFUSION MATRIX CHART ---
fig, ax = plt.subplots(figsize=(7, 5.5), dpi=300)

rf_pred = rf_model.predict(X_test_prep)
cm = confusion_matrix(y_test, rf_pred)

sns.heatmap(cm, annot=True, fmt='d', cmap='Purples', cbar=False, ax=ax,
            annot_kws={"size": 18, "weight": "bold", "color": "black"})

ax.set_xticklabels(['Predicted Incomplete (0)', 'Predicted Completed (1)'], fontweight='bold', color='white')
ax.set_yticklabels(['Actual Incomplete (0)', 'Actual Completed (1)'], fontweight='bold', color='white')
ax.set_title('Confusion Matrix - Random Forest Completion Classifier', fontsize=13, fontweight='bold', color='white', pad=15)
ax.set_facecolor('#0f172a')
fig.patch.set_facecolor('#0f172a')

plt.tight_layout()
save_dual_figure(fig, "confusion_matrix.png")
plt.close()


# --- 3. FEATURE IMPORTANCE CHART ---
cat_encoder = preprocessor.named_transformers_["cat"]
cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL))
all_names = cat_names + NUMERIC

importances = rf_model.feature_importances_
indices = np.argsort(importances)[::-1][:10]

top_names = [all_names[i] for i in indices]
top_importances = importances[indices]

fig, ax = plt.subplots(figsize=(9, 5.5), dpi=300)
bars = ax.barh(range(len(top_names)), top_importances[::-1], color='#a855f7', edgecolor='#c084fc')

ax.set_yticks(range(len(top_names)))
ax.set_yticklabels(top_names[::-1], fontweight='bold', color='white')
ax.set_xlabel('Random Forest Gini Importance Score', fontweight='bold', color='white', labelpad=10)
ax.set_title('Top 10 Feature Importances in Task Completion Model', fontweight='bold', color='white', fontsize=13, pad=15)
ax.set_facecolor('#0f172a')
fig.patch.set_facecolor('#0f172a')
ax.tick_params(colors='white')
ax.xaxis.label.set_color('white')
ax.grid(True, linestyle='--', alpha=0.3)

plt.tight_layout()
save_dual_figure(fig, "feature_importance.png")
plt.close()


# --- 4. PREPROCESSING PIPELINE INFOGRAPHIC ---
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
ax.axis('off')
fig.patch.set_facecolor('#0f172a')

text_content = (
    "DayMind AI Feature Preprocessing & Encoding Pipeline\n"
    "----------------------------------------------------------------------------------------\n\n"
    "1. RAW INPUT DATA (Before Preprocessing):\n"
    "   • Text Prompt: 'I need to learn Java in next 20 days'\n"
    "   • Categoricals: category='learning', priority='high', day='Wed'\n"
    "   • Numerics: hour_slot=15, estimated_duration=90, is_weekend=0\n\n"
    "2. PREPROCESSING TRANSFORMATION:\n"
    "   [A] TF-IDF Vectorization: Text -> 500D Sparse n-gram TF-IDF Matrix\n"
    "   [B] One-Hot Encoding: Category & Priority -> [1, 0, 0, 0, 0, 1, 0, 0...]\n"
    "   [C] Pass-through Numeric Scaling & Feature Selection\n\n"
    "3. PROCESSED FEATURE VECTOR (After Preprocessing):\n"
    "   • Numerical Dense Matrix fed directly into Random Forest & Logistic Regression Models."
)

ax.text(0.05, 0.95, text_content, transform=ax.transAxes, fontsize=11,
        fontfamily='monospace', color='#e2e8f0', verticalalignment='top',
        bbox=dict(boxstyle='round,pad=1', facecolor='#1e293b', edgecolor='#6366f1', lw=2))

plt.tight_layout()
save_dual_figure(fig, "preprocessing_pipeline.png")
plt.close()
