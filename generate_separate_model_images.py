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
from sklearn.metrics import roc_curve, auc, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score

# Paths setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "task_dataset.csv")

# Project images directory
PROJECT_IMAGES_DIR = os.path.join(BASE_DIR, "images")
os.makedirs(PROJECT_IMAGES_DIR, exist_ok=True)

# Artifacts images directory
ARTIFACTS_DIR = "/home/kishore/.gemini/antigravity-ide/brain/270d6b1b-ee23-4e3b-9827-edfca6048077"
ARTIFACT_IMAGES_DIR = os.path.join(ARTIFACTS_DIR, "images")
os.makedirs(ARTIFACT_IMAGES_DIR, exist_ok=True)

plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 11

def save_dual_figure(fig, filename):
    p1 = os.path.join(PROJECT_IMAGES_DIR, filename)
    p2 = os.path.join(ARTIFACT_IMAGES_DIR, filename)
    fig.savefig(p1, dpi=300, bbox_inches='tight')
    fig.savefig(p2, dpi=300, bbox_inches='tight')
    print(f"Saved: {p1}\n       {p2}")

# Load & preprocess dataset
df = pd.read_csv(DATASET_PATH)

CATEGORICAL = ["category", "priority", "day_of_week"]
NUMERIC = ["hour_slot", "estimated_duration", "is_weekend"]

X = df[CATEGORICAL + NUMERIC]
y = df["completed"]

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
], remainder="passthrough")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

X_train_prep = preprocessor.fit_transform(X_train)
X_test_prep = preprocessor.transform(X_test)

# Train Candidate Algorithms
models = {
    "random_forest": {
        "title": "Random Forest Classifier",
        "color": "#8B5CF6",     # Purple
        "cmap": "Purples",
        "model": RandomForestClassifier(n_estimators=200, random_state=42).fit(X_train_prep, y_train)
    },
    "logistic_regression": {
        "title": "Logistic Regression Classifier",
        "color": "#3B82F6",     # Blue
        "cmap": "Blues",
        "model": LogisticRegression(max_iter=1000, random_state=42).fit(X_train_prep, y_train)
    },
    "decision_tree": {
        "title": "Decision Tree Classifier",
        "color": "#F59E0B",     # Amber
        "cmap": "Oranges",
        "model": DecisionTreeClassifier(max_depth=5, random_state=42).fit(X_train_prep, y_train)
    },
    "naive_bayes": {
        "title": "Naive Bayes Classifier",
        "color": "#EF4444",     # Red
        "cmap": "Reds",
        "model": GaussianNB().fit(X_train_prep, y_train)
    }
}

metrics_summary = []

# Generate Separate Plots for Each Algorithm
for key, m_info in models.items():
    title = m_info["title"]
    model = m_info["model"]
    color = m_info["color"]
    cmap = m_info["cmap"]
    
    # 1. Predictions & Probabilities
    y_pred = model.predict(X_test_prep)
    if hasattr(model, "predict_proba"):
        y_probs = model.predict_proba(X_test_prep)[:, 1]
    else:
        y_probs = model.decision_function(X_test_prep)
        
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    fpr, tpr, _ = roc_curve(y_test, y_probs)
    roc_auc = auc(fpr, tpr)
    
    metrics_summary.append({
        "Model": title,
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1-Score": f1,
        "AUC": roc_auc
    })
    
    # --- A. INDIVIDUAL CONFUSION MATRIX (Separate Image) ---
    fig_cm, ax_cm = plt.subplots(figsize=(6.5, 5.2), dpi=300)
    cm = confusion_matrix(y_test, y_pred)
    
    sns.heatmap(cm, annot=True, fmt='d', cmap=cmap, cbar=False, ax=ax_cm,
                annot_kws={"size": 20, "weight": "bold"})
    
    ax_cm.set_xticklabels(['Predicted Incomplete (0)', 'Predicted Completed (1)'], fontweight='bold')
    ax_cm.set_yticklabels(['Actual Incomplete (0)', 'Actual Completed (1)'], fontweight='bold', rotation=90, va='center')
    ax_cm.set_title(f'Confusion Matrix — {title}\nAccuracy: {acc*100:.1f}% | Precision: {prec*100:.1f}%',
                    fontsize=12, fontweight='bold', pad=15, color='#0F172A')
    
    # Add metric annotations below
    plt.tight_layout()
    save_dual_figure(fig_cm, f"{key}_confusion_matrix.png")
    plt.close(fig_cm)
    
    # --- B. INDIVIDUAL ROC CURVE (Separate Image) ---
    fig_roc, ax_roc = plt.subplots(figsize=(7, 5.5), dpi=300)
    
    ax_roc.plot(fpr, tpr, color=color, lw=3, label=f'{title} (AUC = {roc_auc:.3f})')
    ax_roc.plot([0, 1], [0, 1], color='#94A3B8', lw=1.8, linestyle='--', label='Random Baseline (AUC = 0.500)')
    
    ax_roc.set_xlim([-0.02, 1.02])
    ax_roc.set_ylim([-0.02, 1.02])
    ax_roc.set_xlabel('False Positive Rate (1 - Specificity)', fontsize=11, fontweight='bold', labelpad=10)
    ax_roc.set_ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=11, fontweight='bold', labelpad=10)
    ax_roc.set_title(f'ROC Curve — {title}\nArea Under Curve (AUC) = {roc_auc:.3f}',
                     fontsize=12, fontweight='bold', pad=15, color='#0F172A')
    ax_roc.legend(loc="lower right", frameon=True, facecolor='#F8FAFC', edgecolor='#CBD5E1', fontsize=10)
    ax_roc.grid(True, linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    save_dual_figure(fig_roc, f"{key}_roc_curve.png")
    plt.close(fig_roc)

# --- C. COMBINED COMPARISON ROC CURVES ---
fig_all_roc, ax_all_roc = plt.subplots(figsize=(8.5, 6), dpi=300)
for key, m_info in models.items():
    title = m_info["title"]
    model = m_info["model"]
    color = m_info["color"]
    if hasattr(model, "predict_proba"):
        y_probs = model.predict_proba(X_test_prep)[:, 1]
    else:
        y_probs = model.decision_function(X_test_prep)
    fpr, tpr, _ = roc_curve(y_test, y_probs)
    roc_auc = auc(fpr, tpr)
    lw = 2.8 if key == "random_forest" else 2.0
    ls = '-' if key == "random_forest" else '--'
    ax_all_roc.plot(fpr, tpr, color=color, lw=lw, linestyle=ls, label=f'{title} (AUC = {roc_auc:.3f})')

ax_all_roc.plot([0, 1], [0, 1], color='#94A3B8', lw=1.5, linestyle=':', label='Random Baseline (AUC = 0.500)')
ax_all_roc.set_xlim([-0.02, 1.02])
ax_all_roc.set_ylim([-0.02, 1.02])
ax_all_roc.set_xlabel('False Positive Rate (1 - Specificity)', fontsize=11, fontweight='bold', labelpad=10)
ax_all_roc.set_ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=11, fontweight='bold', labelpad=10)
ax_all_roc.set_title('ROC Curves Comparison Across All Candidate Algorithms', fontsize=13, fontweight='bold', pad=15, color='#0F172A')
ax_all_roc.legend(loc="lower right", frameon=True, facecolor='#F8FAFC', edgecolor='#CBD5E1', fontsize=10)
ax_all_roc.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
save_dual_figure(fig_all_roc, "all_models_roc_comparison.png")
plt.close(fig_all_roc)

# --- D. 2x2 GRID CONFUSION MATRICES COMBINED ---
fig_grid, axes = plt.subplots(2, 2, figsize=(11, 9.5), dpi=300)
axes = axes.flatten()

for idx, (key, m_info) in enumerate(models.items()):
    ax = axes[idx]
    title = m_info["title"]
    model = m_info["model"]
    cmap = m_info["cmap"]
    y_pred = model.predict(X_test_prep)
    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)
    
    sns.heatmap(cm, annot=True, fmt='d', cmap=cmap, cbar=False, ax=ax,
                annot_kws={"size": 16, "weight": "bold"})
    ax.set_xticklabels(['Pred Incomplete (0)', 'Pred Completed (1)'], fontweight='bold', fontsize=9)
    ax.set_yticklabels(['Act Incomplete (0)', 'Act Completed (1)'], fontweight='bold', fontsize=9, rotation=90, va='center')
    ax.set_title(f'{title}\n(Accuracy = {acc*100:.1f}%)', fontsize=11, fontweight='bold', color='#0F172A')

plt.suptitle('Confusion Matrix Comparison Grid', fontsize=15, fontweight='bold', y=0.98, color='#0F172A')
plt.tight_layout()
save_dual_figure(fig_grid, "all_models_confusion_matrices.png")
plt.close(fig_grid)

# Print Summary Table
df_metrics = pd.DataFrame(metrics_summary)
print("\n" + "="*70)
print("MODEL EVALUATION PERFORMANCE SUMMARY")
print("="*70)
print(df_metrics.to_string(index=False))
print("="*70)
