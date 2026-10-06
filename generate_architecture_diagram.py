import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_EVAL_DIR = os.path.join(BASE_DIR, "evaluated_images")
os.makedirs(PROJECT_EVAL_DIR, exist_ok=True)

OUTPUT_PNG = os.path.join(PROJECT_EVAL_DIR, "system_architecture_diagram.png")

# Set up matplotlib figure
plt.rcParams['font.family'] = 'DejaVu Sans'
fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Colors - Professional Palette
COLOR_BG = '#F8FAFC'
COLOR_HEADER = '#0F172A'

LAYER_UI = {'fill': '#EFF6FF', 'border': '#3B82F6', 'title': '#1E40AF'}        # Blue
LAYER_API = {'fill': '#F0FDF4', 'border': '#22C55E', 'title': '#15803D'}       # Green
LAYER_ML = {'fill': '#FAF5FF', 'border': '#A855F7', 'title': '#7E22CE'}        # Purple
LAYER_SCHED = {'fill': '#FFF7ED', 'border': '#F97316', 'title': '#C2410C'}     # Orange
LAYER_DATA = {'fill': '#F1F5F9', 'border': '#64748B', 'title': '#334155'}      # Slate Gray

# Draw Title Header Box
fig.patch.set_facecolor(COLOR_BG)
ax.patch.set_facecolor(COLOR_BG)

plt.text(50, 96.5, "DayMind AI — High-Level System Architecture & ML Pipeline",
         fontsize=18, fontweight='bold', ha='center', color=COLOR_HEADER)
plt.text(50, 94.2, "Multi-Model Machine Learning Engine & Dynamic Replanning Architecture",
         fontsize=12, style='italic', ha='center', color='#475569')

def draw_layer_box(ax, x, y, width, height, title, style, subtitle=""):
    rect = patches.FancyBboxPatch((x, y), width, height,
                                  boxstyle="round,pad=0.5,rounding_size=1.5",
                                  linewidth=2, edgecolor=style['border'],
                                  facecolor=style['fill'], zorder=1)
    ax.add_patch(rect)
    plt.text(x + 2, y + height - 3.5, title.upper(), fontsize=11, fontweight='bold', color=style['title'], zorder=2)
    if subtitle:
        plt.text(x + width - 2, y + height - 3.5, subtitle, fontsize=9, style='italic', ha='right', color='#64748B', zorder=2)

def draw_component_box(ax, x, y, width, height, title, details, bg='#FFFFFF', border='#CBD5E1', text_color='#0F172A'):
    rect = patches.FancyBboxPatch((x, y), width, height,
                                  boxstyle="round,pad=0.3,rounding_size=0.8",
                                  linewidth=1.2, edgecolor=border,
                                  facecolor=bg, zorder=3)
    ax.add_patch(rect)
    plt.text(x + width/2, y + height - 2.8, title, fontsize=10, fontweight='bold', ha='center', color=text_color, zorder=4)
    
    # Draw detail text lines
    line_y = y + height - 5.5
    for line in details:
        plt.text(x + width/2, line_y, line, fontsize=8.5, ha='center', color='#334155', zorder=4)
        line_y -= 2.2

# 1. PRESENTATION LAYER (UI)
draw_layer_box(ax, 3, 76, 94, 15, "1. Presentation Layer (Frontend SPA)", LAYER_UI, "React 18 + Vite + Tailwind CSS")
draw_component_box(ax, 5, 78, 27, 10, "Task & Goal Input Portal", ["• Raw Text Task Prompts", "• Priority & Preferred Slots", "• Multi-Day Syllabus Creator"], border='#93C5FD')
draw_component_box(ax, 36.5, 78, 27, 10, "Interactive Calendar & To-Do", ["• Weekly Grid (7 AM - 10 PM)", "• ML Confidence Badges", "• Real-Time Completion Toggles"], border='#93C5FD')
draw_component_box(ax, 68, 78, 27, 10, "ML Dashboard & Replanning", ["• Model Metrics (MAE, Acc, ROC)", "• Dynamic Bumping Audit Log", "• Real-Time NLP Category Preview"], border='#93C5FD')

# Arrow Layer 1 -> Layer 2
ax.annotate('', xy=(50, 74), xytext=(50, 76),
            arrowprops=dict(arrowstyle="->", color='#3B82F6', lw=2.5, mutation_scale=15), zorder=5)
plt.text(51.5, 74.8, "HTTP / JSON REST API Requests", fontsize=8.5, fontweight='bold', color='#1D4ED8')

# 2. API & CONTROLLER LAYER
draw_layer_box(ax, 3, 56, 94, 16, "2. API & Service Routing Layer", LAYER_API, "FastAPI Web Server (Uvicorn)")
draw_component_box(ax, 5, 58, 20, 11, "Task REST Controller", ["/api/tasks/create", "/api/tasks/urgent", "/api/nlp-preview"], border='#86EFAC')
draw_component_box(ax, 28, 58, 21, 11, "Syllabus Controller", ["/api/generate-learning-plan", "/api/tasks/batch"], border='#86EFAC')
draw_component_box(ax, 52, 58, 21, 11, "Analytics Controller", ["/api/metrics", "/api/health", "Pydantic Schema Validation"], border='#86EFAC')
draw_component_box(ax, 76, 58, 19, 11, "CORS & Static Handler", ["Static Assets Server", "Error & Exception Handler"], border='#86EFAC')

# Arrow Layer 2 -> Layer 3
ax.annotate('', xy=(50, 52), xytext=(50, 56),
            arrowprops=dict(arrowstyle="->", color='#16A34A', lw=2.5, mutation_scale=15), zorder=5)
plt.text(51.5, 53.6, "Inference Calls & Task Vectors", fontsize=8.5, fontweight='bold', color='#15803D')

# 3. MACHINE LEARNING ENGINE LAYER
draw_layer_box(ax, 3, 30, 94, 20, "3. Machine Learning Pipeline (Scikit-Learn Engine)", LAYER_ML, "Pre-trained Multi-Model Ensemble")
draw_component_box(ax, 5, 32.5, 27, 14, "NLP Text Classifier", ["• TF-IDF Unigram/Bigram Vectorizer", "• Multi-Class Logistic Regression", "• Outputs: academic, work, health,", "  personal, learning (+ Confidence Score)"], bg='#F3E8FF', border='#C084FC', text_color='#6B21A8')
draw_component_box(ax, 36.5, 32.5, 27, 14, "Duration Regressor", ["• ColumnTransformer Encoding", "• Random Forest Regressor (200 Trees)", "• Predicts: Actual Execution Minutes", "• Fixes Human Planning Fallacy"], bg='#F3E8FF', border='#C084FC', text_color='#6B21A8')
draw_component_box(ax, 68, 32.5, 27, 14, "Slot Completion Evaluator", ["• ColumnTransformer Encoding", "• Random Forest Classifier (200 Trees)", "• Predicts: P(Completion = 1 | Slot)", "• Generates Slot Confidence Score"], bg='#F3E8FF', border='#C084FC', text_color='#6B21A8')

# Arrow Layer 3 -> Layer 4
ax.annotate('', xy=(50, 26), xytext=(50, 30),
            arrowprops=dict(arrowstyle="->", color='#9333EA', lw=2.5, mutation_scale=15), zorder=5)
plt.text(51.5, 27.6, "Predicted Durations & Slot Probabilities", fontsize=8.5, fontweight='bold', color='#7E22CE')

# 4. SCHEDULING & SELF-HEALING ENGINE LAYER
draw_layer_box(ax, 3, 11, 94, 13, "4. Optimal Scheduling & Self-Healing Engine", LAYER_SCHED, "Dynamic Priority-Weighted Solver")
draw_component_box(ax, 8, 13, 38, 8.5, "Optimal Slot Allocation Engine", ["Score = P(Completion) × Weight(Priority) + SlotPreferenceBonus", "Finds highest-scoring non-overlapping window across Mon-Sun"], bg='#FFEDD5', border='#FDBA74', text_color='#9A3412')
draw_component_box(ax, 54, 13, 38, 8.5, "Priority-Weighted Self-Healing Bumper", ["Flexibility = (1 - PriorityWeight) / SlotCompletionProb", "Bumps lowest-priority task to alternate slot when urgent item arrives"], bg='#FFEDD5', border='#FDBA74', text_color='#9A3412')

# Arrow Layer 4 -> Layer 5
ax.annotate('', xy=(50, 7.5), xytext=(50, 11),
            arrowprops=dict(arrowstyle="->", color='#EA580C', lw=2.5, mutation_scale=15), zorder=5)

# 5. DATA PERSISTENCE & STORAGE LAYER
draw_layer_box(ax, 3, 1, 94, 5.5, "5. Persistence & Storage Layer", LAYER_DATA, "Local Storage & Model Binaries")
plt.text(18, 3, "SQLite Database (daymind.db)\n[tasks, urgent_log]", fontsize=9, fontweight='bold', ha='center', color='#1E293B')
plt.text(50, 3, "Model Binaries (models/*.pkl)\n[duration_model.pkl, completion_model.pkl]", fontsize=9, fontweight='bold', ha='center', color='#1E293B')
plt.text(82, 3, "Training Dataset & Metrics\n[task_dataset.csv, metrics.json]", fontsize=9, fontweight='bold', ha='center', color='#1E293B')

# Save PNG image
plt.savefig(OUTPUT_PNG, dpi=300, bbox_inches='tight')
print(f"Architecture diagram generated successfully at: {OUTPUT_PNG}")
