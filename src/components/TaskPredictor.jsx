import React, { useState } from 'react';
import { Cpu, AlertCircle, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function TaskPredictor() {
  const [taskText, setTaskText] = useState('Finish assignment writeup');
  const [category, setCategory] = useState('academic');
  const [priority, setPriority] = useState('high');
  const [dayOfWeek, setDayOfWeek] = useState('Mon');
  const [hourSlot, setHourSlot] = useState(14);
  const [estimatedDuration, setEstimatedDuration] = useState(45);

  const isWeekend = ['Sat', 'Sun'].includes(dayOfWeek) ? 1 : 0;

  // Calculate prediction using the exact synthetic generation logit model
  const priorityFactors = { low: 1.0, medium: 1.15, high: 1.35 };
  const predictedActualDuration = Math.round(estimatedDuration * priorityFactors[priority]);

  // Logit score calculation
  let logit = 0.5; // Base positive bias
  const factors = [];

  // Hour slot effect
  if (hourSlot >= 22 || hourSlot <= 5) {
    logit -= 2.2;
    factors.push({ label: 'Late-Night Hour Penalty (22:00-05:00)', impact: -2.2, type: 'negative' });
  } else if (hourSlot >= 8 && hourSlot <= 17) {
    logit += 0.9;
    factors.push({ label: 'Peak Daytime Productivity Slot', impact: +0.9, type: 'positive' });
  } else if (hourSlot >= 18 && hourSlot <= 21) {
    logit += 0.3;
    factors.push({ label: 'Evening Focus Window', impact: +0.3, type: 'positive' });
  }

  // Priority effect
  if (priority === 'high') {
    logit += 1.4;
    factors.push({ label: 'High Priority Urgency Boost', impact: +1.4, type: 'positive' });
  } else if (priority === 'medium') {
    logit += 0.3;
    factors.push({ label: 'Medium Priority Baseline', impact: +0.3, type: 'positive' });
  } else {
    logit -= 0.8;
    factors.push({ label: 'Low Priority Procrastination Risk', impact: -0.8, type: 'negative' });
  }

  // Weekend work/academic slump
  if (isWeekend === 1 && ['work', 'academic'].includes(category)) {
    logit -= 1.6;
    factors.push({ label: 'Weekend Work / Academic Burnout Penalty', impact: -1.6, type: 'negative' });
  } else if (isWeekend === 1 && ['health', 'personal'].includes(category)) {
    logit += 0.4;
    factors.push({ label: 'Weekend Health & Personal Task Boost', impact: +0.4, type: 'positive' });
  }

  // Duration overload
  if (estimatedDuration > 75) {
    logit -= 0.5;
    factors.push({ label: 'Long Duration Fatigue (>75 mins)', impact: -0.5, type: 'negative' });
  }

  // Sigmoid probability calculation
  const probability = 1.0 / (1.0 + Math.exp(-logit));
  const probPercent = (probability * 100).toFixed(1);

  let statusBadgeClass = 'badge-completed';
  let statusText = 'High Completion Likelihood';
  let statusColor = '#34d399';

  if (probability < 0.45) {
    statusBadgeClass = 'badge-failed';
    statusText = 'High Drop Risk (Unlikely to Complete)';
    statusColor = '#fb7185';
  } else if (probability < 0.70) {
    statusBadgeClass = 'badge-medium';
    statusText = 'Moderate Completion Chance';
    statusColor = '#fbbf24';
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '28px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc' }}>
          <Cpu size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>AI Task Completion Predictor</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Simulate ML model inferences based on the embedded synthetic dataset rules.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        {/* Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Task Description
            </label>
            <input
              type="text"
              className="input-field"
              value={taskText}
              onChange={e => setTaskText(e.target.value)}
              placeholder="e.g. Finish assignment draft"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Category
              </label>
              <select className="select-field" style={{ width: '100%' }} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="academic">Academic</option>
                <option value="work">Work</option>
                <option value="health">Health</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Priority
              </label>
              <select className="select-field" style={{ width: '100%' }} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Day of Week
              </label>
              <select className="select-field" style={{ width: '100%' }} value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Scheduled Hour ({hourSlot}:00)
              </label>
              <input
                type="range"
                min="0"
                max="23"
                value={hourSlot}
                onChange={e => setHourSlot(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary-violet)', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Est. Mins
              </label>
              <input
                type="number"
                min="10"
                max="180"
                className="input-field"
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Prediction Results & Explanation */}
        <div style={{ background: 'rgba(10, 14, 23, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>PREDICTED COMPLETION</span>
              <span className={`badge ${statusBadgeClass}`}>{statusText}</span>
            </div>

            <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: statusColor, marginBottom: '8px' }}>
              {probPercent}%
            </div>

            {/* Probability Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '5px', overflow: 'hidden', marginBottom: '16px' }}>
              <div
                style={{
                  width: `${probPercent}%`,
                  height: '100%',
                  background: probability > 0.7 ? 'linear-gradient(90deg, #10b981, #34d399)' : probability > 0.45 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #f43f5e, #fb7185)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            {/* Duration Prediction */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <Clock size={16} color="#fbbf24" />
              <span>Est. Actual Duration: <strong style={{ color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{predictedActualDuration} mins</strong> (Priority Multiplier: {priorityFactors[priority]}x)</span>
            </div>

            {/* Feature Impact List */}
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Embedded Model Factor Breakdown:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {factors.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: f.type === 'positive' ? '#6ee7b7' : '#fda4af' }}>
                  <span>• {f.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{f.impact > 0 ? `+${f.impact}` : f.impact} logit</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
