import React from 'react';
import { X, Calendar, Clock, CheckCircle, Trash2, Zap, TrendingUp, Sparkles, Layers } from 'lucide-react';

export default function DayAgendaModal({ isOpen, onClose, dateInfo, tasks, onToggleTask, onDeleteTask }) {
  if (!isOpen || !dateInfo) return null;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'academic': return 'border-purple-200 bg-purple-50 text-purple-950';
      case 'work': return 'border-blue-200 bg-blue-50 text-blue-950';
      case 'health': return 'border-emerald-200 bg-emerald-50 text-emerald-950';
      case 'personal': return 'border-amber-200 bg-amber-50 text-amber-950';
      case 'learning': return 'border-rose-200 bg-rose-50 text-rose-950';
      default: return 'border-slate-200 bg-slate-100 text-slate-950';
    }
  };

  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const totalMins = tasks.reduce((sum, t) => sum + (t.predicted_duration || t.estimated_duration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 shadow-xl bg-white">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {dateInfo.full_formatted || dateInfo.date}
                </h2>
                {dateInfo.is_today && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Google Calendar Day Agenda • {tasks.length} Scheduled Task{tasks.length === 1 ? '' : 's'} (~{totalMins} mins total)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No tasks scheduled for this date!</p>
              <p className="text-xs text-slate-500">Your schedule is free for {dateInfo.formatted}.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition shadow-2xs ${getCategoryColor(task.category)} ${
                  task.completed ? 'opacity-60 line-through' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {formatHour(task.hour_slot)}
                      </span>

                      <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded bg-white/80 border border-black/5 text-slate-800">
                        {task.category}
                      </span>

                      {task.is_urgent === 1 && (
                        <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 fill-current" /> Urgent
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {task.task_text}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.estimated_duration}m (ML Predicted: {task.predicted_duration}m)
                      </span>

                      <span className="flex items-center gap-1 text-emerald-700 font-bold">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        {Math.round(task.completion_prob * 100)}% ML Score
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`p-2 rounded-lg transition border ${
                        task.completed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                      }`}
                      title={task.completed ? 'Mark Pending' : 'Mark Complete'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-2 rounded-lg bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 transition"
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
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
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
