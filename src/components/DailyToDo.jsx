import React, { useState } from 'react';
import { CheckSquare, Square, Trash2, Zap, Clock, Tag, TrendingUp, Filter } from 'lucide-react';

export default function DailyToDo({ tasks, onToggleTask, onDeleteTask }) {
  const [selectedDay, setSelectedDay] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');

  const DAYS = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const filteredTasks = tasks.filter((t) => {
    if (selectedDay !== 'All' && t.day_of_week !== selectedDay) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'academic': return 'badge-academic';
      case 'work': return 'badge-work';
      case 'health': return 'badge-health';
      case 'personal': return 'badge-personal';
      case 'learning': return 'badge-learning';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            Day-by-Day To-Do Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological task execution plan with ML duration predictions
          </p>
        </div>

        {/* Day Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                selectedDay === day
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs font-medium bg-slate-50/50">
          No tasks found for selected filters. Click "+ New Goal or Task" in the top bar to schedule one!
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`glass-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                t.completed ? 'opacity-60' : ''
              } ${t.is_urgent ? 'border-red-200 bg-red-50/40' : 'bg-white'}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggleTask(t.id)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-600 transition flex-shrink-0"
                >
                  {t.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.task_text}
                    </span>

                    {t.is_urgent === 1 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        URGENT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-500 flex-wrap">
                    <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      📅 {t.task_date || t.day_of_week} ({t.day_of_week}) @ {t.hour_slot > 12 ? t.hour_slot - 12 : t.hour_slot}:00 {t.hour_slot >= 12 ? 'PM' : 'AM'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${getCategoryBadgeClass(t.category)}`}>
                      <Tag className="w-2.5 h-2.5 inline mr-1" />
                      {t.category}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>

                    <span className="flex items-center gap-1 text-slate-600 text-[11px] font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Est: {t.estimated_duration}m | <strong className="text-indigo-700 font-semibold">ML ~{t.predicted_duration}m</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <div
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  title="ML Random Forest predicted completion success rate"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{Math.round(t.completion_prob * 100)}% ML Score</span>
                </div>

                <button
                  onClick={() => onDeleteTask(t.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
