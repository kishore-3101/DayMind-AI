import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import WeeklyCalendar from './components/WeeklyCalendar';
import DailyToDo from './components/DailyToDo';
import UrgentReplanBanner from './components/UrgentReplanBanner';
import MLInsightsModal from './components/MLInsightsModal';
import LearningGoalWizardModal from './components/LearningGoalWizardModal';
import DayAgendaModal from './components/DayAgendaModal';
import { Calendar as CalendarIcon, CheckSquare, Sparkles } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [replanData, setReplanData] = useState(null);
  const [isMLInsightsOpen, setIsMLInsightsOpen] = useState(false);
  
  // Date Navigation State
  const [currentStartDateStr, setCurrentStartDateStr] = useState(null);
  
  // Selected Day Agenda Drawer State
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);
  const [isDayAgendaOpen, setIsDayAgendaOpen] = useState(false);

  // Learning Goal Wizard state
  const [isLearningWizardOpen, setIsLearningWizardOpen] = useState(false);
  const [wizardInitialTopic, setWizardInitialTopic] = useState('');

  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'todo'
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);

  useEffect(() => {
    fetchCalendarAndTasks(currentStartDateStr);
  }, [currentStartDateStr]);

  const buildFallbackCalendar = (startDateStr = null) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const workHours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculate Monday of week
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const startDt = startDateStr ? new Date(startDateStr) : new Date(today.setDate(today.getDate() - dayOfWeek));
    
    const datesList = [];
    const grid = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDt);
      d.setDate(d.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const dayName = days[dayIdx];
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      datesList.push({
        date: dStr,
        day_name: dayName,
        formatted: `${monthName} ${d.getDate()}`,
        full_formatted: `${d.toLocaleString('en-US', { weekday: 'long' })}, ${monthName} ${d.getDate()}`,
        day_num: d.getDate(),
        is_today: dStr === todayStr,
        is_weekend: d.getDay() === 0 || d.getDay() === 6
      });
      grid[dStr] = {};
      workHours.forEach(h => grid[dStr][h] = null);
    }
    
    return {
      start_date: startDt.toISOString().split('T')[0],
      header_title: "Weekly Calendar Schedule",
      dates: datesList,
      days: days,
      work_hours: workHours,
      calendar: grid,
      total_tasks: 0,
      completed_tasks: 0
    };
  };

  const fetchCalendarAndTasks = async (startDate = null) => {
    setIsLoading(true);
    try {
      const url = startDate ? `/api/calendar?start_date=${startDate}` : '/api/calendar';
      const [calRes, tasksRes] = await Promise.all([
        fetch(url),
        fetch('/api/tasks')
      ]);

      if (calRes.ok && tasksRes.ok) {
        const calData = await calRes.json();
        const tData = await tasksRes.json();
        if (calData && calData.calendar) {
          setCalendarData(calData);
        } else {
          setCalendarData(buildFallbackCalendar(startDate));
        }
        setTasks(tData.tasks || []);
      } else {
        console.warn('API returned non-ok status, utilizing client fallback');
        setCalendarData(buildFallbackCalendar(startDate));
      }
    } catch (err) {
      console.error('Failed to fetch app data:', err);
      setCalendarData(buildFallbackCalendar(startDate));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateWeek = (offsetDays) => {
    const baseDate = calendarData?.start_date ? new Date(calendarData.start_date) : new Date();
    baseDate.setDate(baseDate.getDate() + offsetDays);
    const dateStr = baseDate.toISOString().split('T')[0];
    setCurrentStartDateStr(dateStr);
  };

  const handleSetToday = () => {
    setCurrentStartDateStr(null);
  };

  const handleSelectDate = (dateInfo) => {
    setSelectedDateInfo(dateInfo);
    setIsDayAgendaOpen(true);
  };

  const handleOpenLearningWizard = (initialTopic = '') => {
    setWizardInitialTopic(initialTopic);
    setIsLearningWizardOpen(true);
  };

  const handleBatchScheduleSuccess = async (data) => {
    if (data && data.replan_summary) {
      setReplanData(data.replan_summary);
    }
    await fetchCalendarAndTasks(currentStartDateStr);
  };

  const handleAddTask = async (taskInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskInput)
      });
      if (res.ok) {
        await fetchCalendarAndTasks(currentStartDateStr);
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUrgentTask = async (urgentInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks/urgent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(urgentInput)
      });
      const data = await res.json();
      if (res.ok) {
        setReplanData(data.replan_summary);
        await fetchCalendarAndTasks(currentStartDateStr);
      }
    } catch (err) {
      console.error('Failed to add urgent task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        await fetchCalendarAndTasks(currentStartDateStr);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchCalendarAndTasks(currentStartDateStr);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleRebalance = async () => {
    setIsRebalancing(true);
    try {
      const res = await fetch('/api/schedule/rebalance', {
        method: 'POST'
      });
      if (res.ok) {
        await fetchCalendarAndTasks(currentStartDateStr);
      }
    } catch (err) {
      console.error('Failed to rebalance schedule:', err);
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      const res = await fetch('/api/seed-demo', {
        method: 'POST'
      });
      if (res.ok) {
        await fetchCalendarAndTasks(currentStartDateStr);
      }
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    }
  };

  const totalTasks = calendarData?.total_tasks || 0;
  const completedTasks = calendarData?.completed_tasks || 0;

  // Filter tasks for selected date in Day Agenda Modal
  const dateTasks = selectedDateInfo
    ? tasks.filter((t) => (t.task_date || t.created_at?.split('T')[0]) === selectedDateInfo.date)
    : [];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Header Navbar */}
      <Header
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        onOpenMLInsights={() => setIsMLInsightsOpen(true)}
        onOpenLearningWizard={() => handleOpenLearningWizard('')}
      />

      {/* Dynamic Urgent Replanning Banner */}
      <UrgentReplanBanner
        replanData={replanData}
        onClose={() => setReplanData(null)}
      />

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Weekly Calendar View
        </button>

        <button
          onClick={() => setActiveTab('todo')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'todo'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Day-by-Day To-Do Schedule ({tasks.length})
        </button>
      </div>

      {/* Active Tab View Content */}
      {activeTab === 'calendar' ? (
        <WeeklyCalendar
          calendarData={calendarData}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onNavigateWeek={handleNavigateWeek}
          onSetToday={handleSetToday}
          onSelectDate={handleSelectDate}
        />
      ) : (
        <DailyToDo
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* ML Evaluation Insights Dashboard Modal */}
      <MLInsightsModal
        isOpen={isMLInsightsOpen}
        onClose={() => setIsMLInsightsOpen(false)}
      />

      {/* Multi-Day Learning Goal Planner Wizard Modal */}
      <LearningGoalWizardModal
        isOpen={isLearningWizardOpen}
        onClose={() => setIsLearningWizardOpen(false)}
        initialTopic={wizardInitialTopic}
        onBatchScheduleSuccess={handleBatchScheduleSuccess}
      />

      {/* Google Calendar Style Interactive Day Agenda Modal */}
      <DayAgendaModal
        isOpen={isDayAgendaOpen}
        onClose={() => setIsDayAgendaOpen(false)}
        dateInfo={selectedDateInfo}
        tasks={dateTasks}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Footer / Hosting Info */}
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-200 mt-8">
        <p>
          DayMind AI • Machine Learning Subject Project • Built with Scikit-Learn, FastAPI, React & SQLite
        </p>
      </footer>
    </div>
  );
}
