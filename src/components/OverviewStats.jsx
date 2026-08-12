import React from 'react';
import { CheckCircle2, Clock, Moon, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';

export default function OverviewStats({ data }) {
  if (!data || data.length === 0) return null;

  const totalTasks = data.length;
  const completedTasks = data.filter(d => Number(d.completed) === 1).length;
  const overallRate = ((completedTasks / totalTasks) * 100).toFixed(1);

  // Time of day calculation
  const nightTasks = data.filter(d => {
    const h = Number(d.hour_slot);
    return h >= 22 || h <= 5;
  });
  const nightCompleted = nightTasks.filter(d => Number(d.completed) === 1).length;
  const nightRate = nightTasks.length ? ((nightCompleted / nightTasks.length) * 100).toFixed(1) : 0;

  const dayTasks = data.filter(d => {
    const h = Number(d.hour_slot);
    return h >= 6 && h <= 16;
  });
  const dayCompleted = dayTasks.filter(d => Number(d.completed) === 1).length;
  const dayRate = dayTasks.length ? ((dayCompleted / dayTasks.length) * 100).toFixed(1) : 0;

  // High priority tasks
  const highPrio = data.filter(d => d.priority === 'high');
  const highPrioCompleted = highPrio.filter(d => Number(d.completed) === 1).length;
  const highPrioRate = highPrio.length ? ((highPrioCompleted / highPrio.length) * 100).toFixed(1) : 0;

  // Duration overrun high priority
  let highPrioOverrun = 0;
  if (highPrio.length) {
    const ratios = highPrio.map(d => Number(d.actual_duration) / Number(d.estimated_duration));
    highPrioOverrun = (((ratios.reduce((a, b) => a + b, 0) / ratios.length) - 1) * 100).toFixed(1);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
      {/* Card 1: Total Tasks */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>SYNTHETIC SAMPLES</span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
            <Sparkles size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
          {totalTasks.toLocaleString()}
        </div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '6px' }}>
          Reproducible seed (seed = 42)
        </div>
      </div>

      {/* Card 2: Overall Completion */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>OVERALL COMPLETION</span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
          {overallRate}%
        </div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '6px' }}>
          {completedTasks} completed out of {totalTasks}
        </div>
      </div>

      {/* Card 3: Late-Night Penalty */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>LATE-NIGHT RATE</span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
            <Moon size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
          {nightRate}%
        </div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '6px' }}>
          vs {dayRate}% daytime completion rate
        </div>
      </div>

      {/* Card 4: High Priority Reliability */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>HIGH PRIORITY RATE</span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
            <TrendingUp size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
          {highPrioRate}%
        </div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '6px' }}>
          High priority tasks completed
        </div>
      </div>

      {/* Card 5: Duration Overrun */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>HIGH PRIO OVERRUN</span>
          <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
          +{highPrioOverrun}%
        </div>
        <div style={{ color: 'var(--text-subtle)', fontSize: '0.78rem', marginTop: '6px' }}>
          Actual time vs estimated duration
        </div>
      </div>
    </div>
  );
}
