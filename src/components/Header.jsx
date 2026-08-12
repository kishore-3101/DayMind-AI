import React from 'react';
import { Cpu, Calendar, Sparkles, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';

export default function Header({ totalTasks, completedTasks, onOpenMLInsights, onOpenLearningWizard, onSeedDemo, onRebalance, isRebalancing }) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <header className="glass-panel p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Cpu className="w-7 h-7 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-300">
              DayMind <span className="text-purple-400">AI</span>
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ML Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-Powered Dynamic Calendar & Productivity Scheduler • ML Subject Project
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 text-purple-300">
            <Calendar className="w-4 h-4" />
            <span>{totalTasks} Tasks</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{completionRate}% Done</span>
          </div>
        </div>

        {/* Learning Goal Wizard Trigger */}
        <button
          onClick={() => onOpenLearningWizard && onOpenLearningWizard()}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 transform hover:scale-105"
          title="Create a multi-day learning roadmap with custom days & daily hours"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>+ Learning Goal</span>
        </button>

        {/* Rebalance Schedule */}
        <button
          onClick={onRebalance}
          disabled={isRebalancing}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium transition flex items-center gap-1.5 text-slate-200"
          title="Re-optimize calendar slots using ML model"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRebalancing ? 'animate-spin text-purple-400' : ''}`} />
          <span>{isRebalancing ? 'Optimizing...' : 'ML Rebalance'}</span>
        </button>

        {/* Seed Demo Data */}
        <button
          onClick={onSeedDemo}
          className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-medium text-purple-300 transition flex items-center gap-1.5"
          title="Populate demo tasks for presentation"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Seed Demo</span>
        </button>

        {/* ML Insights Modal Trigger */}
        <button
          onClick={onOpenMLInsights}
          className="btn-primary text-xs py-2 px-3"
          title="View ML evaluation metrics & feature importances"
        >
          <BarChart2 className="w-4 h-4" />
          <span>ML Analytics</span>
        </button>
      </div>
    </header>
  );
}
