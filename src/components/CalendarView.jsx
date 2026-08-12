import React from 'react';
import { Clock, AlertCircle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';

export default function CalendarView({ schedule, onToggleComplete, startHour = 8, endHour = 20 }) {
  if (!schedule || schedule.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Enter your primary goal or concern on the left panel to generate your smart AI calendar schedule.
      </div>
    );
  }

  // Get unique days present in the schedule
  const maxDays = Math.max(...schedule.map(s => s.dayIndex), 5);
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI Smart Calendar Timetable</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Schedule optimized using historical completion rates & duration multipliers from <code>dataset.csv</code>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }}></span> High Priority
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}></span> Medium Priority
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }}></span> Low Priority
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e11d48', border: '2px solid #ffffff' }}></span> 🚨 Urgent Task
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${days.length}, minmax(160px, 1fr))`, gap: '8px', minWidth: '850px' }}>
        {/* Header Row */}
        <div style={{ padding: '12px', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
          Time
        </div>
        {days.map(d => (
          <div key={d} style={{ padding: '12px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', background: 'rgba(10, 14, 23, 0.6)', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
            Day {d}
          </div>
        ))}

        {/* Time Slots */}
        {hours.map(hour => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div style={{ padding: '10px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px border-subtle' }}>
              {String(hour).padStart(2, '0')}:00
            </div>

            {/* Day columns for this hour slot */}
            {days.map(dayIdx => {
              // Find task matching this day and hour
              const task = schedule.find(s => s.dayIndex === dayIdx && hour >= s.startHour && hour < s.endHour);
              const isStartSlot = task && task.startHour === hour;

              if (!task) {
                return (
                  <div
                    key={`${dayIdx}-${hour}`}
                    style={{
                      height: '52px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px dashed rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px'
                    }}
                  />
                );
              }

              if (!isStartSlot) return null; // Rendered spanning card in start slot

              const span = task.endHour - task.startHour;
              const isUrgent = task.isUrgent;
              const isRescheduled = task.wasRescheduled;

              return (
                <div
                  key={task.id}
                  style={{
                    gridRow: `span ${span}`,
                    background: isUrgent ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.4))' : task.completed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(18, 24, 38, 0.85)',
                    border: isUrgent ? '2px solid #f43f5e' : isRescheduled ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    boxShadow: isUrgent ? '0 0 15px rgba(244, 63, 94, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Top Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority}
                      </span>
                      {isRescheduled && (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                          <RefreshCw size={10} /> Shifted
                        </span>
                      )}
                      {isUrgent && (
                        <span className="badge" style={{ background: '#f43f5e', color: '#ffffff', fontWeight: 800 }}>
                          🚨 URGENT
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: task.completed ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.completed ? 'line-through' : 'none', marginBottom: '6px', lineHeight: '1.3' }}>
                      {task.title}
                    </div>
                  </div>

                  {/* Footer Stats & Checkbox */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#fbbf24" />
                      {task.estMinutes}m (Act: {task.actualMinutes}m)
                    </span>

                    <button
                      onClick={() => onToggleComplete(task.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: task.completed ? '#34d399' : 'var(--text-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {task.completed ? 'Done' : 'Mark'}
                    </button>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
