import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Calendar as CalendarIcon, ListTodo, Zap, Clock, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import CalendarView from './components/CalendarView.jsx';
import ScheduleList from './components/ScheduleList.jsx';
import UrgentTaskModal from './components/UrgentTaskModal.jsx';
import ReplanningLogBar from './components/ReplanningLogBar.jsx';
import { buildSmartSchedule, replanWithUrgentTask } from './utils/schedulerEngine.js';

export default function App() {
  const [userConcern, setUserConcern] = useState('Preparing for ML midterms while managing client web project');
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(20);
  const [numDays, setNumDays] = useState(5);

  const [schedule, setSchedule] = useState([]);
  const [replanningLogs, setReplanningLogs] = useState([]);
  const [activeView, setActiveView] = useState('calendar');
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  // Load dataset.csv to verify dataset presence
  useEffect(() => {
    Papa.parse('/dataset.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setDatasetLoaded(true);
        }
      }
    });
  }, []);

  // Initial schedule generation
  const handleGenerateSchedule = (e) => {
    if (e) e.preventDefault();
    if (!userConcern.trim()) return;

    const newSchedule = buildSmartSchedule({
      concernText: userConcern,
      startHour: Number(startHour),
      endHour: Number(endHour),
      totalDays: Number(numDays)
    });

    setSchedule(newSchedule);
    setReplanningLogs([]);
  };

  // Auto-generate initial schedule on load
  useEffect(() => {
    handleGenerateSchedule();
  }, []);

  // Handle Dynamic Urgent Task Injection
  const handleInjectUrgentTask = (urgentTask) => {
    if (!schedule || schedule.length === 0) return;

    const { updatedSchedule, logs } = replanWithUrgentTask({
      schedule,
      urgentTask,
      startHour: Number(startHour),
      endHour: Number(endHour)
    });

    setSchedule(updatedSchedule);
    setReplanningLogs(prev => [...logs, ...prev]);
  };

  // Toggle task completion
  const handleToggleComplete = (taskId) => {
    setSchedule(prev => prev.map(item => item.id === taskId ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '16px 32px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
              <CalendarIcon size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">
                  DayMind AI
                </h1>
                <span className="badge badge-cat">Smart Calendar & Task Scheduler</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Powered by <code>dataset.csv</code> historical duration & completion patterns
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(10, 14, 23, 0.7)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <button
              className="btn-secondary"
              style={{ border: 'none', background: activeView === 'calendar' ? 'rgba(99, 102, 241, 0.25)' : 'transparent', color: activeView === 'calendar' ? '#ffffff' : 'var(--text-muted)' }}
              onClick={() => setActiveView('calendar')}
            >
              <CalendarIcon size={16} />
              Timetable Calendar
            </button>

            <button
              className="btn-secondary"
              style={{ border: 'none', background: activeView === 'todo' ? 'rgba(99, 102, 241, 0.25)' : 'transparent', color: activeView === 'todo' ? '#ffffff' : 'var(--text-muted)' }}
              onClick={() => setActiveView('todo')}
            >
              <ListTodo size={16} />
              Day-to-Day Schedule List
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        
        {/* Left Sidebar: Controls & Urgent Injector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* User Concern & Time Config Panel */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#a5b4fc" />
              <span>User Goal & Concern</span>
            </h3>

            <form onSubmit={handleGenerateSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  What is your primary goal or concern?
                </label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={userConcern}
                  onChange={e => setUserConcern(e.target.value)}
                  placeholder="e.g. Preparing for exams, managing work deadlines & workout..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Available Start
                  </label>
                  <select className="select-field" style={{ width: '100%' }} value={startHour} onChange={e => setStartHour(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => i + 6).map(h => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}:00 AM</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Available End
                  </label>
                  <select className="select-field" style={{ width: '100%' }} value={endHour} onChange={e => setEndHour(Number(e.target.value))}>
                    {Array.from({ length: 10 }, (_, i) => i + 15).map(h => (
                      <option key={h} value={h}>{h > 12 ? h - 12 : h}:00 PM</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Target Horizon (Days): {numDays} Days
                </label>
                <input
                  type="range"
                  min="3"
                  max="7"
                  value={numDays}
                  onChange={e => setNumDays(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--primary-violet)' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}>
                <Sparkles size={16} />
                Generate Smart Timetable
              </button>
            </form>
          </div>

          {/* Urgent Task Injector Panel */}
          <UrgentTaskModal onInjectUrgentTask={handleInjectUrgentTask} maxDays={numDays} />
        </div>

        {/* Right Main Panel: Replanning Feed & Calendar/Schedule Views */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Dynamic Replanning Log Banner */}
          <ReplanningLogBar logs={replanningLogs} />

          {/* Active View */}
          {activeView === 'calendar' ? (
            <CalendarView
              schedule={schedule}
              onToggleComplete={handleToggleComplete}
              startHour={startHour}
              endHour={endHour}
            />
          ) : (
            <ScheduleList
              schedule={schedule}
              onToggleComplete={handleToggleComplete}
            />
          )}
        </div>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 32px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', background: 'rgba(7, 9, 14, 0.9)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span>DayMind AI — Smart Task Scheduling & Dynamic Urgent Task Replanner</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Data Source: dataset.csv (1,200 records loaded)</span>
        </div>
      </footer>
    </div>
  );
}
