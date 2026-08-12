import React from 'react';
import { RefreshCw, CheckCircle2, Zap, AlertTriangle } from 'lucide-react';

export default function ReplanningLogBar({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '16px 20px', marginBottom: '24px', borderLeft: '4px solid #f43f5e', background: 'rgba(244, 63, 94, 0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.9rem', color: '#fb7185' }}>
          <Zap size={16} />
          <span>Dynamic Replanning Activity Feed ({logs.length} events)</span>
        </div>
        <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
          Calendar Updated
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
        {logs.map((log, idx) => (
          <div key={idx} style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px', color: log.type === 'urgent_injected' ? '#f43f5e' : '#fbbf24' }}>
            <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7, fontSize: '0.75rem' }}>[{log.time}]</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
