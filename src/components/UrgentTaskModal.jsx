import React, { useState } from 'react';
import { AlertOctagon, Zap, ArrowRight } from 'lucide-react';

export default function UrgentTaskModal({ onInjectUrgentTask, maxDays = 5 }) {
  const [urgentTitle, setUrgentTitle] = useState('Fix production database outage');
  const [category, setCategory] = useState('work');
  const [targetDay, setTargetDay] = useState(1);
  const [targetHour, setTargetHour] = useState(10);
  const [estMinutes, setEstMinutes] = useState(120);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!urgentTitle.trim()) return;

    onInjectUrgentTask({
      title: urgentTitle,
      category,
      targetDay: Number(targetDay),
      targetHour: Number(targetHour),
      estMinutes: Number(estMinutes)
    });
  };

  return (
    <div style={{ background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{ padding: '8px', borderRadius: '10px', background: '#f43f5e', color: '#ffffff' }}>
          <AlertOctagon size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fb7185' }}>🚨 Urgent Interruption Injector</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Inject unexpected tasks to trigger real-time AI schedule replanning.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            Urgent Task Description
          </label>
          <input
            type="text"
            className="input-field"
            value={urgentTitle}
            onChange={e => setUrgentTitle(e.target.value)}
            placeholder="e.g. Production bug fix / Urgent exam review"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Category
            </label>
            <select className="select-field" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="work">Work</option>
              <option value="academic">Academic</option>
              <option value="health">Health</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Est. Duration (Mins)
            </label>
            <input
              type="number"
              className="input-field"
              value={estMinutes}
              onChange={e => setEstMinutes(e.target.value)}
              min="15"
              max="240"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Target Day
            </label>
            <select className="select-field" style={{ width: '100%' }} value={targetDay} onChange={e => setTargetDay(e.target.value)}>
              {Array.from({ length: maxDays }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Target Hour Slot ({targetHour}:00)
            </label>
            <input
              type="range"
              min="8"
              max="18"
              value={targetHour}
              onChange={e => setTargetHour(e.target.value)}
              style={{ width: '100%', accentColor: '#f43f5e' }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            color: '#ffffff',
            fontWeight: 700,
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '6px',
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)'
          }}
        >
          <Zap size={16} />
          Inject Urgent Task & Replan Schedule
        </button>
      </form>
    </div>
  );
}
