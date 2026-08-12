import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
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

  const fetchCalendarAndTasks = async (startDate = null) => {
    setIsLoading(true);
    try {
      const url = startDate ? `/api/calendar?start_date=${startDate}` : '/api/calendar';
      const [calRes, tasksRes] = await Promise.all([
        fetch(url),
        fetch('/api/tasks')
      ]);
      const calData = await calRes.json();
      const tData = await tasksRes.json();
      setCalendarData(calData);
      setTasks(tData.tasks || []);
    } catch (err) {
      console.error('Failed to fetch app data:', err);
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

  const handleBatchScheduleSuccess = async () => {
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
        onSeedDemo={handleSeedDemo}
        onRebalance={handleRebalance}
        isRebalancing={isRebalancing}
      />

      {/* Dynamic Urgent Replanning Banner */}
      <UrgentReplanBanner
        replanData={replanData}
        onClose={() => setReplanData(null)}
      />

      {/* Main Task Concern Scheduler Input Form */}
      <TaskForm
        onAddTask={handleAddTask}
        onAddUrgentTask={handleAddUrgentTask}
        onOpenLearningWizard={handleOpenLearningWizard}
        isSubmitting={isSubmitting}
      />

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'calendar'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'glass-card text-slate-400 hover:text-white'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Weekly Calendar View
        </button>

        <button
          onClick={() => setActiveTab('todo')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'todo'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'glass-card text-slate-400 hover:text-white'
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
      <footer className="text-center text-xs text-slate-500 py-6 border-t border-white/5 mt-8">
        <p>
          DayMind AI • Machine Learning Subject Project • Built with Scikit-Learn, FastAPI, React & SQLite
        </p>
      </footer>
    </div>
  );
}
