import React from 'react';
import { Zap, AlertTriangle, ArrowRight, X } from 'lucide-react';

export default function UrgentReplanBanner({ replanData, onClose }) {
  if (!replanData) return null;

  const { urgent_task, bumped_task, action_type, description } = replanData;

  return (
    <div className="glass-panel p-4 mb-6 border-red-500/40 bg-gradient-to-r from-red-950/40 via-purple-950/40 to-slate-950/40 animate-fadeIn relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-400 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0 animate-bounce">
          <Zap className="w-5 h-5 fill-current" />
        </div>

        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Dynamic Schedule Replan Executed
            </h3>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-red-500/20 text-red-400 rounded border border-red-500/30">
              {action_type}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            {description}
          </p>

          {bumped_task && (
            <div className="mt-2 text-xs bg-black/40 p-2 rounded-lg border border-white/10 flex flex-wrap items-center gap-2 text-slate-300">
              <span className="text-red-400 font-semibold">⚡ Urgent:</span>
              <span className="text-white">{urgent_task?.task_text}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-amber-400 font-semibold">Rescheduled:</span>
              <span className="text-slate-200">
                "{bumped_task?.task_text}" ➔ {bumped_task?.day_of_week} @ {bumped_task?.hour_slot}:00
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
