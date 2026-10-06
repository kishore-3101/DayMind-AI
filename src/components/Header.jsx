import React from 'react';
import { Plus, BarChart2, CalendarCheck, CheckCircle2 } from 'lucide-react';

export default function Header({ totalTasks, completedTasks, onOpenMLInsights, onOpenLearningWizard }) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <header className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs font-bold text-lg">
          D
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              DayMind
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Intelligent Goal Roadmap & Calendar Scheduler
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Quick Stats */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <CalendarCheck className="w-4 h-4 text-slate-500" />
            <span>{totalTasks} Tasks</span>
          </div>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{completionRate}% Complete</span>
          </div>
        </div>

        {/* Create Plan / Learning Goal Button */}
        <button
          onClick={() => onOpenLearningWizard && onOpenLearningWizard()}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          title="Create a new goal, roadmap, or task schedule"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Goal or Task</span>
        </button>

        {/* ML Insights Button */}
        <button
          onClick={onOpenMLInsights}
          className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          title="View ML evaluation metrics"
        >
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <span>ML Analytics</span>
        </button>
      </div>
    </header>
  );
}
