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
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'academic': return 'badge-academic';
      case 'work': return 'badge-work';
      case 'health': return 'badge-health';
      case 'personal': return 'badge-personal';
      case 'learning': return 'badge-learning';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            Day-by-Day To-Do Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological task execution plan with ML duration predictions
          </p>
        </div>

        {/* Day Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/10">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                selectedDay === day
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl text-slate-400 text-sm">
          No tasks found for selected filters. Add a concern or task above!
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`glass-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                t.completed ? 'opacity-50' : ''
              } ${t.is_urgent ? 'border-red-500/50 bg-red-950/20' : ''}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggleTask(t.id)}
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition flex-shrink-0"
                >
                  {t.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {t.task_text}
                    </span>

                    {t.is_urgent === 1 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        URGENT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400 flex-wrap">
                    <span className="font-mono text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      📅 {t.task_date || t.day_of_week} ({t.day_of_week}) @ {t.hour_slot > 12 ? t.hour_slot - 12 : t.hour_slot}:00 {t.hour_slot >= 12 ? 'PM' : 'AM'}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${getCategoryBadgeClass(t.category)}`}>
                      <Tag className="w-2.5 h-2.5 inline mr-1" />
                      {t.category}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>

                    <span className="flex items-center gap-1 text-slate-300 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Est: {t.estimated_duration}m | <strong className="text-purple-300">ML ~{t.predicted_duration}m</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                <div
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                  title="ML Random Forest predicted completion success rate"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{Math.round(t.completion_prob * 100)}% ML Score</span>
                </div>

                <button
                  onClick={() => onDeleteTask(t.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition"
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
