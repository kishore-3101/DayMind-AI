import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function PatternCharts({ data }) {
  if (!data || data.length === 0) return null;

  // 1. Time-of-day completion calculation
  const buckets = [
    { label: 'Morning (06-11)', filter: h => h >= 6 && h <= 11 },
    { label: 'Afternoon (12-16)', filter: h => h >= 12 && h <= 16 },
    { label: 'Evening (17-21)', filter: h => h >= 17 && h <= 21 },
    { label: 'Night (22-05)', filter: h => h >= 22 || h <= 5 }
  ];

  const timeBucketRates = buckets.map(b => {
    const subset = data.filter(d => b.filter(Number(d.hour_slot)));
    const completed = subset.filter(d => Number(d.completed) === 1).length;
    return subset.length ? ((completed / subset.length) * 100).toFixed(1) : 0;
  });

  const timeChartData = {
    labels: buckets.map(b => b.label),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: timeBucketRates,
        backgroundColor: [
          'rgba(6, 182, 212, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(99, 102, 241, 0.7)',
          'rgba(244, 63, 94, 0.7)'
        ],
        borderColor: [
          '#06b6d4',
          '#10b981',
          '#6366f1',
          '#f43f5e'
        ],
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  // 2. Priority Duration Multipliers (Actual / Estimated)
  const priorities = ['low', 'medium', 'high'];
  const avgRatios = priorities.map(prio => {
    const subset = data.filter(d => d.priority === prio);
    if (!subset.length) return 1.0;
    const totalRatio = subset.reduce((acc, curr) => acc + (Number(curr.actual_duration) / Number(curr.estimated_duration)), 0);
    return (totalRatio / subset.length).toFixed(3);
  });

  const priorityCompletionRates = priorities.map(prio => {
    const subset = data.filter(d => d.priority === prio);
    const completed = subset.filter(d => Number(d.completed) === 1).length;
    return subset.length ? ((completed / subset.length) * 100).toFixed(1) : 0;
  });

  const priorityChartData = {
    labels: ['Low Priority', 'Medium Priority', 'High Priority'],
    datasets: [
      {
        type: 'bar',
        label: 'Completion Rate (%)',
        data: priorityCompletionRates,
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderRadius: 8,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Avg Duration Multiplier (Actual / Est)',
        data: avgRatios,
        borderColor: '#f59e0b',
        backgroundColor: '#f59e0b',
        borderWidth: 3,
        pointRadius: 6,
        yAxisID: 'y1'
      }
    ]
  };

  // 3. Weekend vs Weekday Work & Academic Completion
  const workAcadData = data.filter(d => ['work', 'academic'].includes(d.category));
  const workAcadWeekday = workAcadData.filter(d => Number(d.is_weekend) === 0);
  const workAcadWeekend = workAcadData.filter(d => Number(d.is_weekend) === 1);

  const workWeekdayRate = ((workAcadWeekday.filter(d => d.category === 'work' && Number(d.completed) === 1).length / (workAcadWeekday.filter(d => d.category === 'work').length || 1)) * 100).toFixed(1);
  const workWeekendRate = ((workAcadWeekend.filter(d => d.category === 'work' && Number(d.completed) === 1).length / (workAcadWeekend.filter(d => d.category === 'work').length || 1)) * 100).toFixed(1);

  const acadWeekdayRate = ((workAcadWeekday.filter(d => d.category === 'academic' && Number(d.completed) === 1).length / (workAcadWeekday.filter(d => d.category === 'academic').length || 1)) * 100).toFixed(1);
  const acadWeekendRate = ((workAcadWeekend.filter(d => d.category === 'academic' && Number(d.completed) === 1).length / (workAcadWeekend.filter(d => d.category === 'academic').length || 1)) * 100).toFixed(1);

  const weekendChartData = {
    labels: ['Work Tasks', 'Academic Tasks'],
    datasets: [
      {
        label: 'Weekday Completion Rate (%)',
        data: [workWeekdayRate, acadWeekdayRate],
        backgroundColor: 'rgba(6, 182, 212, 0.7)',
        borderColor: '#06b6d4',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Weekend Completion Rate (%)',
        data: [workWeekendRate, acadWeekendRate],
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

  // 4. Hourly Distribution (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourlyCounts = hours.map(h => data.filter(d => Number(d.hour_slot) === h).length);

  const hourlyChartData = {
    labels: hours.map(h => `${h}:00`),
    datasets: [
      {
        label: 'Task Scheduled Volume',
        data: hourlyCounts,
        fill: true,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#8b5cf6'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
      }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px', marginBottom: '28px' }}>
      {/* Pattern 1: Time of Day Completion Drop */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            1. Late-Night Drop Pattern
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Completion probability drops dramatically during 22:00-05:00 hours compared to daytime slots.
          </p>
        </div>
        <div style={{ height: '260px' }}>
          <Bar data={timeChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { max: 100 } } }} />
        </div>
      </div>

      {/* Pattern 2: Priority vs Duration Multiplier */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            2. Priority Completion & Duration Overrun
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            High priority tasks have higher completion rates but experience longer duration overruns (1.35x estimated).
          </p>
        </div>
        <div style={{ height: '260px' }}>
          <Bar
            data={priorityChartData}
            options={{
              ...chartOptions,
              scales: {
                x: chartOptions.scales.x,
                y: { type: 'linear', position: 'left', title: { display: true, text: 'Completion Rate (%)', color: '#94a3b8' }, grid: chartOptions.scales.y.grid, ticks: chartOptions.scales.y.ticks },
                y1: { type: 'linear', position: 'right', title: { display: true, text: 'Actual/Est Ratio', color: '#f59e0b' }, grid: { drawOnChartArea: false }, ticks: { color: '#f59e0b' } }
              }
            }}
          />
        </div>
      </div>

      {/* Pattern 3: Work/Academic Weekend Slump */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            3. Weekend Work & Academic Slump
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Work and academic tasks scheduled on Saturday/Sunday experience significantly lower completion rates.
          </p>
        </div>
        <div style={{ height: '260px' }}>
          <Bar data={weekendChartData} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { max: 100 } } }} />
        </div>
      </div>

      {/* Pattern 4: Hourly Task Distribution */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            4. Category-Based Hour Slot Clustering
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            24-hour schedule distribution showing peak scheduling clusters across the synthetic dataset.
          </p>
        </div>
        <div style={{ height: '260px' }}>
          <Line data={hourlyChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
