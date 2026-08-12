import React from 'react';
import { X, Calendar, Clock, CheckCircle, Trash2, Zap, TrendingUp, Sparkles, Layers } from 'lucide-react';

export default function DayAgendaModal({ isOpen, onClose, dateInfo, tasks, onToggleTask, onDeleteTask }) {
  if (!isOpen || !dateInfo) return null;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'academic': return 'border-purple-500/40 bg-purple-500/10 text-purple-200';
      case 'work': return 'border-blue-500/40 bg-blue-500/10 text-blue-200';
      case 'health': return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
      case 'personal': return 'border-amber-500/40 bg-amber-500/10 text-amber-200';
      case 'learning': return 'border-pink-500/40 bg-pink-500/10 text-pink-200';
      default: return 'border-slate-500/40 bg-slate-500/10 text-slate-200';
    }
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const totalMins = tasks.reduce((sum, t) => sum + (t.predicted_duration || t.estimated_duration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col border border-indigo-500/30 shadow-2xl shadow-indigo-950/50">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  {dateInfo.full_formatted || dateInfo.date}
                </h2>
                {dateInfo.is_today && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Google Calendar Day Agenda • {tasks.length} Scheduled Task{tasks.length === 1 ? '' : 's'} (~{totalMins} mins total)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No tasks scheduled for this date!</p>
              <p className="text-xs text-slate-500">Your schedule is free for {dateInfo.formatted}.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition ${getCategoryColor(task.category)} ${
                  task.completed ? 'opacity-50 line-through' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                        {formatHour(task.hour_slot)}
                      </span>

                      <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded bg-black/40">
                        {task.category}
                      </span>

                      {task.is_urgent === 1 && (
                        <span className="text-xs font-bold text-red-400 flex items-center gap-1 animate-pulse">
                          <Zap className="w-3.5 h-3.5 fill-current" /> Urgent
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {task.task_text}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.estimated_duration}m (ML Predicted: {task.predicted_duration}m)
                      </span>

                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        {Math.round(task.completion_prob * 100)}% ML Score
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`p-2 rounded-lg transition border ${
                        task.completed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-white/10'
                      }`}
                      title={task.completed ? 'Mark Pending' : 'Mark Complete'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 transition"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5 py-2"
          >
            Close Day View
          </button>
        </div>

      </div>
    </div>
  );
}
