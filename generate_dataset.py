"""
Synthetic Dataset Generator for AI Task Scheduling & Productivity ML Models.

Why Synthetic Data?
-------------------
No public, open-source dataset exists that captures granular individual task-scheduling 
behavior (such as task categories, scheduled hour slots, priority-based duration overruns, 
and time-of-day completion probabilities). Therefore, this script synthetically generates 
realistic task history data reflecting natural human behavior patterns for training and 
evaluating machine learning models in task completion prediction and intelligent scheduling.

Embedded Behavioral Patterns:
1. Category-based Hour Clustering: Health tasks cluster in early morning (05:00-08:00), 
   Work/Academic in daytime (09:00-17:00), Learning in evening (17:00-22:00), Personal in afternoon/evening.
2. Late-Night Drop: Completion probability drops drastically for tasks scheduled between 22:00 and 05:00.
3. Priority Dynamics: High-priority tasks have higher completion likelihood than low-priority tasks.
4. Weekend Slump: Work and Academic tasks have significantly lower completion rates on weekends.
5. Duration Overruns: actual_duration = estimated_duration * priority_factor * random_noise, 
   where priority_factor increases with priority level (High priority tasks tend to run longer).
"""

import numpy as np
import pandas as pd

def generate_synthetic_task_dataset(n_samples=1200, seed=42):
    """
    Generates a synthetic task history dataset with realistic behavioral patterns.

    Parameters:
        n_samples (int): Number of rows to generate (default 1200).
        seed (int): Random seed for reproducibility (default 42).

    Returns:
        pd.DataFrame: Generated dataset containing task features and completion target.
    """
    np.random.seed(seed)

    categories = ['academic', 'work', 'health', 'personal', 'learning']
    category_weights = [0.25, 0.30, 0.15, 0.15, 0.15]
    
    priorities = ['low', 'medium', 'high']
    priority_weights = [0.35, 0.45, 0.20]

    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    day_weights = [0.16, 0.16, 0.16, 0.16, 0.16, 0.10, 0.10]

    # Task descriptions per category
    task_pool = {
        'academic': [
            'finish assignment', 'study for midterms', 'read chapter', 
            'prepare presentation', 'research paper draft', 'lab report writeup',
            'review lecture notes', 'solve problem set'
        ],
        'work': [
            'reply to emails', 'team standup', 'write project report', 
            'code review', 'prepare slide deck', 'client call', 
            'update roadmap', 'fix high-prio bug'
        ],
        'health': [
            'gym workout', 'morning run', 'yoga session', 
            'meditation session', 'meal prep', 'stretching routine', 
            'evening walk', 'cycling session'
        ],
        'personal': [
            'pay bills', 'grocery shopping', 'laundry & cleaning', 
            'call family', 'organize closet', 'car maintenance', 
            'plan weekend trip', 'budget review'
        ],
        'learning': [
            'watch tutorial', 'read tech book', 'practice coding', 
            'online course', 'listen to podcast', 'language practice', 
            'algorithm practice', 'system design study'
        ]
    }

    # 1. Sample Category, Priority, Day of Week
    sampled_categories = np.random.choice(categories, size=n_samples, p=category_weights)
    sampled_priorities = np.random.choice(priorities, size=n_samples, p=priority_weights)
    sampled_days = np.random.choice(days, size=n_samples, p=day_weights)
    is_weekend = np.array([1 if d in ['Sat', 'Sun'] else 0 for d in sampled_days])

    # Sample task text based on category
    sampled_tasks = [np.random.choice(task_pool[cat]) for cat in sampled_categories]

    # 2. Sample Hour Slot based on Category distribution
    hour_slots = np.zeros(n_samples, dtype=int)
    for i, cat in enumerate(sampled_categories):
        if cat == 'health':
            # Peak early morning (05:00 - 08:00)
            h = int(np.random.normal(loc=6.5, scale=1.5))
            hour_slots[i] = np.clip(h, 5, 10)
        elif cat in ['work', 'academic']:
            # Peak daytime (09:00 - 17:00)
            h = int(np.random.normal(loc=13.0, scale=2.5))
            hour_slots[i] = np.clip(h, 8, 18)
        elif cat == 'learning':
            # Peak evening (17:00 - 22:00)
            h = int(np.random.normal(loc=19.5, scale=2.0))
            hour_slots[i] = np.clip(h, 16, 23)
        else: # personal
            # Afternoon / Evening (11:00 - 21:00)
            h = int(np.random.normal(loc=16.0, scale=3.0))
            hour_slots[i] = np.clip(h, 10, 22)
        
        # Add 10% chance of random scatter across 24h
        if np.random.rand() < 0.10:
            hour_slots[i] = np.random.randint(0, 24)

    # 3. Estimated Duration (minutes) based on category
    estimated_durations = np.zeros(n_samples, dtype=int)
    for i, cat in enumerate(sampled_categories):
        if cat == 'academic':
            dur = int(np.random.normal(60, 20))
            estimated_durations[i] = np.clip(dur, 30, 120)
        elif cat == 'work':
            dur = int(np.random.normal(45, 15))
            estimated_durations[i] = np.clip(dur, 15, 90)
        elif cat == 'health':
            dur = int(np.random.normal(40, 10))
            estimated_durations[i] = np.clip(dur, 20, 75)
        elif cat == 'learning':
            dur = int(np.random.normal(50, 15))
            estimated_durations[i] = np.clip(dur, 25, 90)
        else: # personal
            dur = int(np.random.normal(30, 10))
            estimated_durations[i] = np.clip(dur, 15, 60)

    # 4. Actual Duration correlation with priority level + random noise
    # priority_factor increases with priority level: low -> 1.00, medium -> 1.15, high -> 1.35
    priority_factors = {'low': 1.00, 'medium': 1.15, 'high': 1.35}
    actual_durations = np.zeros(n_samples, dtype=int)

    for i in range(n_samples):
        p_factor = priority_factors[sampled_priorities[i]]
        noise = np.random.normal(loc=1.0, scale=0.10)
        noise = np.clip(noise, 0.75, 1.40)
        act_dur = int(round(estimated_durations[i] * p_factor * noise))
        actual_durations[i] = max(5, act_dur)

    # 5. Completed Binary Label (Probabilistic Logit Model)
    # Base probability calculation based on realistic constraints
    logits = np.zeros(n_samples)

    for i in range(n_samples):
        h = hour_slots[i]
        cat = sampled_categories[i]
        prio = sampled_priorities[i]
        wknd = is_weekend[i]
        est_dur = estimated_durations[i]

        logit = 0.5  # Baseline positive bias

        # Late-night drop (22:00 - 05:00)
        if h >= 22 or h <= 5:
            logit -= 2.2
        elif 8 <= h <= 17:
            logit += 0.9
        elif 18 <= h <= 21:
            logit += 0.3

        # Priority boost
        if prio == 'high':
            logit += 1.4
        elif prio == 'medium':
            logit += 0.3
        else: # low
            logit -= 0.8

        # Weekend slump for work & academic tasks
        if wknd == 1 and cat in ['work', 'academic']:
            logit -= 1.6
        elif wknd == 1 and cat in ['health', 'personal']:
            logit += 0.4  # People complete health/personal tasks on weekends

        # Oversized task penalty
        if est_dur > 75:
            logit -= 0.5

        # Stochastic noise
        logit += np.random.normal(loc=0, scale=0.45)
        logits[i] = logit

    # Convert logit to probability via sigmoid function
    probabilities = 1.0 / (1.0 + np.exp(-logits))
    completed_labels = (np.random.rand(n_samples) < probabilities).astype(int)

    # Create DataFrame
    df = pd.DataFrame({
        'task_text': sampled_tasks,
        'category': sampled_categories,
        'priority': sampled_priorities,
        'day_of_week': sampled_days,
        'is_weekend': is_weekend,
        'hour_slot': hour_slots,
        'estimated_duration': estimated_durations,
        'actual_duration': actual_durations,
        'completed': completed_labels
    })

    return df

def time_of_day_bucket(hour):
    """Categorizes hour slot into time-of-day buckets."""
    if 22 <= hour or hour <= 5:
        return 'Night (22:00-05:00)'
    elif 6 <= hour <= 11:
        return 'Morning (06:00-11:00)'
    elif 12 <= hour <= 16:
        return 'Afternoon (12:00-16:00)'
    else:
        return 'Evening (17:00-21:00)'

def print_dataset_summary(df):
    """Prints diagnostic summary verifying embedded patterns in the dataset."""
    df['time_bucket'] = df['hour_slot'].apply(time_of_day_bucket)
    
    print("\n" + "=" * 65)
    print("      DAYMIND AI SYNTHETIC TASK DATASET SUMMARY (1,200 ROWS)      ")
    print("=" * 65)
    print(f"\nTotal Tasks Generated: {len(df)}")
    print(f"Overall Completion Rate: {df['completed'].mean() * 100:.2f}%\n")

    print("--- 1. Completion Rate by Time-of-Day Bucket ---")
    tod_summary = df.groupby('time_bucket')['completed'].agg(
        total_tasks='count',
        completed_tasks='sum',
        completion_rate=lambda x: f"{x.mean() * 100:.2f}%"
    ).reindex([
        'Morning (06:00-11:00)', 
        'Afternoon (12:00-16:00)', 
        'Evening (17:00-21:00)', 
        'Night (22:00-05:00)'
    ])
    print(tod_summary.to_string())

    print("\n--- 2. Completion Rate by Priority ---")
    prio_summary = df.groupby('priority')['completed'].agg(
        total_tasks='count',
        completion_rate=lambda x: f"{x.mean() * 100:.2f}%"
    ).reindex(['low', 'medium', 'high'])
    print(prio_summary.to_string())

    print("\n--- 3. Duration Ratio (Actual / Estimated) by Priority ---")
    df['duration_ratio'] = df['actual_duration'] / df['estimated_duration']
    ratio_summary = df.groupby('priority')['duration_ratio'].agg(
        avg_ratio='mean',
        min_ratio='min',
        max_ratio='max'
    ).reindex(['low', 'medium', 'high'])
    print(ratio_summary.to_string())

    print("\n--- 4. Work & Academic Completion: Weekday vs Weekend ---")
    work_acad = df[df['category'].isin(['work', 'academic'])]
    wknd_summary = work_acad.groupby(['category', 'is_weekend'])['completed'].agg(
        count='count',
        completion_rate=lambda x: f"{x.mean() * 100:.2f}%"
    )
    print(wknd_summary.to_string())
    print("=" * 65 + "\n")

if __name__ == '__main__':
    # Generate 1200 rows with fixed seed 42
    df = generate_synthetic_task_dataset(n_samples=1200, seed=42)
    
    # Save output to task_dataset.csv
    csv_filename = 'task_dataset.csv'
    df.to_csv(csv_filename, index=False)
    # Also save to dataset.csv for backwards compatibility
    df.to_csv('dataset.csv', index=False)
    print(f"[SUCCESS] Saved 1200 synthetic rows to '{csv_filename}' and 'dataset.csv'.")
    
    # Print summary verification table
    print_dataset_summary(df)
