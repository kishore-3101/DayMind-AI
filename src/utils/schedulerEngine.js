/**
 * Scheduler Engine powered by dataset.csv historical task patterns.
 */

// Priority duration multipliers derived from dataset.csv analysis
export const PRIORITY_MULTIPLIERS = {
  low: 1.0,
  medium: 1.15,
  high: 1.35
};

// Optimal hour ranges per category derived from dataset.csv peak completion rates
export const CATEGORY_OPTIMAL_HOURS = {
  health: { start: 6, end: 9, label: 'Early Morning' },
  work: { start: 9, end: 17, label: 'Daytime Business Hours' },
  academic: { start: 9, end: 17, label: 'Daytime Focus Window' },
  personal: { start: 16, end: 19, label: 'Late Afternoon' },
  learning: { start: 18, end: 21, label: 'Evening Learning Window' }
};

/**
 * Derives task templates from user's primary goal / concern
 */
export function generateTasksFromConcern(concernText) {
  const textLower = concernText.toLowerCase();
  const tasks = [];

  // Determine category focus from user prompt keywords
  if (textLower.includes('exam') || textLower.includes('study') || textLower.includes('assignment') || textLower.includes('academic') || textLower.includes('ml')) {
    tasks.push(
      { title: 'Review lecture notes & slides', category: 'academic', priority: 'high', estMinutes: 60 },
      { title: 'Solve textbook practice problems', category: 'academic', priority: 'high', estMinutes: 90 },
      { title: 'Summary study notes & formula sheet', category: 'academic', priority: 'medium', estMinutes: 60 },
      { title: 'Watch topic tutorial video', category: 'learning', priority: 'medium', estMinutes: 45 },
      { title: 'Mock exam practice quiz', category: 'academic', priority: 'high', estMinutes: 75 }
    );
  }

  if (textLower.includes('work') || textLower.includes('project') || textLower.includes('code') || textLower.includes('client') || textLower.includes('bug')) {
    tasks.push(
      { title: 'Team standup & roadmap sync', category: 'work', priority: 'medium', estMinutes: 30 },
      { title: 'High priority code implementation & review', category: 'work', priority: 'high', estMinutes: 120 },
      { title: 'Reply to client & team emails', category: 'work', priority: 'low', estMinutes: 30 },
      { title: 'Prepare project status report', category: 'work', priority: 'medium', estMinutes: 45 }
    );
  }

  if (textLower.includes('health') || textLower.includes('gym') || textLower.includes('workout') || textLower.includes('fit') || textLower.includes('run')) {
    tasks.push(
      { title: 'Gym strength training session', category: 'health', priority: 'high', estMinutes: 60 },
      { title: 'Morning cardio & stretching', category: 'health', priority: 'medium', estMinutes: 40 },
      { title: 'Healthy meal prep & hydration check', category: 'health', priority: 'medium', estMinutes: 30 }
    );
  }

  // Fallback defaults if general concern
  if (tasks.length === 0) {
    tasks.push(
      { title: 'Core milestone execution phase 1', category: 'academic', priority: 'high', estMinutes: 90 },
      { title: 'Daily status review & planning', category: 'work', priority: 'medium', estMinutes: 30 },
      { title: 'Skill development & tutorial reading', category: 'learning', priority: 'medium', estMinutes: 60 },
      { title: 'Physical exercise & wellness break', category: 'health', priority: 'medium', estMinutes: 45 },
      { title: 'Personal errands & bill payments', category: 'personal', priority: 'low', estMinutes: 30 }
    );
  }

  return tasks;
}

/**
 * Builds a multi-day day-to-day schedule mapped to calendar time slots
 */
export function buildSmartSchedule({ concernText, startHour = 8, endHour = 20, totalDays = 5 }) {
  const baseTasks = generateTasksFromConcern(concernText);
  const schedule = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
    const dayName = dayNames[dayIdx % 7];
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
    let currentHour = startHour;

    // Pick 3-5 tasks for the day
    const dayTasksPool = [...baseTasks].sort(() => 0.5 - Math.random());
    const selectedTasks = dayTasksPool.slice(0, Math.min(4, dayTasksPool.length));

    selectedTasks.forEach((task, tIdx) => {
      if (currentHour >= endHour) return;

      const durationMultiplier = PRIORITY_MULTIPLIERS[task.priority] || 1.0;
      const actualMinutes = Math.round(task.estMinutes * durationMultiplier);
      const durationHours = Math.ceil(actualMinutes / 60);

      const startSlot = currentHour;
      const endSlot = Math.min(endHour, currentHour + durationHours);

      schedule.push({
        id: `task-${dayIdx + 1}-${tIdx + 1}-${Date.now().toString(36)}`,
        dayIndex: dayIdx + 1,
        dayName: dayName,
        isWeekend: isWeekend,
        title: task.title,
        category: task.category,
        priority: task.priority,
        estMinutes: task.estMinutes,
        actualMinutes: actualMinutes,
        startHour: startSlot,
        endHour: endSlot,
        completed: false,
        wasRescheduled: false
      });

      currentHour = endSlot + 1; // 1-hour break/buffer slot
    });
  }

  return schedule;
}

/**
 * Dynamically replans the schedule when an urgent task arrives
 */
export function replanWithUrgentTask({ schedule, urgentTask, startHour = 8, endHour = 20 }) {
  const updatedSchedule = [];
  const logs = [];

  const urgentStartHour = Number(urgentTask.targetHour) || startHour;
  const urgentDayIndex = Number(urgentTask.targetDay) || 1;
  const urgentDurationHours = Math.ceil((Number(urgentTask.estMinutes) || 60) / 60);
  const urgentEndHour = Math.min(endHour, urgentStartHour + urgentDurationHours);

  // 1. Create the new Urgent Task item
  const newUrgentItem = {
    id: `urgent-${Date.now()}`,
    dayIndex: urgentDayIndex,
    dayName: `Day ${urgentDayIndex}`,
    isWeekend: false,
    title: `🚨 URGENT: ${urgentTask.title}`,
    category: urgentTask.category || 'work',
    priority: 'high',
    estMinutes: Number(urgentTask.estMinutes) || 60,
    actualMinutes: Math.round((Number(urgentTask.estMinutes) || 60) * 1.35),
    startHour: urgentStartHour,
    endHour: urgentEndHour,
    completed: false,
    isUrgent: true,
    wasRescheduled: false
  };

  logs.push({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: 'urgent_injected',
    message: `🚨 Urgent Task "${urgentTask.title}" injected at Day ${urgentDayIndex} (${urgentStartHour}:00 - ${urgentEndHour}:00).`
  });

  // Sort existing schedule by day and start time
  const sortedExisting = [...schedule].sort((a, b) => (a.dayIndex * 24 + a.startHour) - (b.dayIndex * 24 + b.startHour));

  let pendingReschedule = [];

  sortedExisting.forEach(task => {
    // Check if task overlaps with urgent task on the same day
    const isSameDay = task.dayIndex === urgentDayIndex;
    const isOverlapping = isSameDay && (
      (task.startHour >= urgentStartHour && task.startHour < urgentEndHour) ||
      (task.endHour > urgentStartHour && task.endHour <= urgentEndHour) ||
      (task.startHour <= urgentStartHour && task.endHour >= urgentEndHour)
    );

    if (isOverlapping) {
      // Conflict detected! Mark task for rescheduling to later slot
      pendingReschedule.push(task);
    } else {
      updatedSchedule.push(task);
    }
  });

  // Add urgent item to schedule
  updatedSchedule.push(newUrgentItem);

  // 2. Reschedule conflicting tasks to next available open slots
  pendingReschedule.forEach(conflictingTask => {
    let newDay = conflictingTask.dayIndex;
    let newStart = urgentEndHour + 1; // Try slot after urgent task finishes

    if (newStart + 1 > endHour) {
      // Shift to next day
      newDay += 1;
      newStart = startHour;
    }

    const duration = conflictingTask.endHour - conflictingTask.startHour;
    const rescheduledItem = {
      ...conflictingTask,
      dayIndex: newDay,
      dayName: `Day ${newDay}`,
      startHour: newStart,
      endHour: Math.min(endHour, newStart + duration),
      wasRescheduled: true
    };

    updatedSchedule.push(rescheduledItem);
    logs.push({
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'task_shifted',
      message: `🔄 Task "${conflictingTask.title}" shifted from Day ${conflictingTask.dayIndex} (${conflictingTask.startHour}:00) to Day ${newDay} (${newStart}:00).`
    });
  });

  // Final sort by dayIndex and startHour
  updatedSchedule.sort((a, b) => (a.dayIndex * 24 + a.startHour) - (b.dayIndex * 24 + b.startHour));

  return { updatedSchedule, logs };
}
