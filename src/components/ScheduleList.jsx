import React from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export default function ScheduleList({ schedule, onToggleComplete }) {
  if (!schedule || schedule.length === 0) return null;

  // Group tasks by day
  const groupedByDay = schedule.reduce((acc, task) => {
    const key = `Day ${task.dayIndex} (${task.dayName || 'Scheduled'})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Day-to-Day Action Schedule (To-Do List)</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Sequential list of daily tasks with dataset-derived duration predictions.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(groupedByDay).map(([dayLabel, tasks]) => (
          <div key={dayLabel} style={{ background: 'rgba(10, 14, 23, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{dayLabel}</span>
              <span className="badge badge-cat">{tasks.length} Tasks</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map(task => {
                const isUrgent = task.isUrgent;
                const isRescheduled = task.wasRescheduled;

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifySpace: 'space-between',
                      padding: '12px 16px',
                      background: isUrgent ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isUrgent ? '1px solid #f43f5e' : isRescheduled ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <button
                        onClick={() => onToggleComplete(task.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.completed ? '#34d399' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>

                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {task.title}
                          {isUrgent && <span className="badge" style={{ background: '#f43f5e', color: '#fff' }}>🚨 URGENT</span>}
                          {isRescheduled && <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}><RefreshCw size={10} /> Shifted</span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span>Category: <strong style={{ color: '#a5b4fc' }}>{task.category}</strong></span>
                          <span>Slot: <strong style={{ fontFamily: 'var(--font-mono)' }}>{String(task.startHour).padStart(2, '0')}:00 - {String(task.endHour).padStart(2, '0')}:00</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ color: 'var(--text-muted)' }}>Est: {task.estMinutes}m</div>
                        <div style={{ color: '#fbbf24', fontWeight: 600 }}>Act: {task.actualMinutes}m</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
