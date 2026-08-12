import React from 'react';
import { BookOpen, Sparkles, Terminal, FileCode, CheckCircle } from 'lucide-react';

export default function DocstringBanner() {
  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '28px', borderLeft: '4px solid var(--primary-violet)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', flexShrink: 0 }}>
          <BookOpen size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>ML Course Project Context & Synthetic Dataset Rationale</h3>
            <span className="badge badge-cat">generate_dataset.py</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
            <strong>Why Synthetic Data?</strong> Currently, no public, open-source dataset exists capturing granular individual task-scheduling behavior (category clustering, time-of-day completion rates, and priority duration overruns). This dataset synthetically models realistic human productivity patterns for training task recommendation and completion prediction models.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '0.82rem', color: 'var(--text-main)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <CheckCircle size={14} color="#34d399" />
              <span><strong>Category Clustering:</strong> Health (AM), Work (Day), Learning (Eve)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <CheckCircle size={14} color="#34d399" />
              <span><strong>Late-Night Drop:</strong> 22:00-05:00 hours completion ~15%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <CheckCircle size={14} color="#34d399" />
              <span><strong>Priority Overrun:</strong> High priority = 1.35x estimated duration</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px' }}>
              <CheckCircle size={14} color="#34d399" />
              <span><strong>Weekend Slump:</strong> Work/Academic completion drops on Sat/Sun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
