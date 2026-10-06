import React from 'react';
import { Zap, AlertTriangle, ArrowRight, X } from 'lucide-react';

export default function UrgentReplanBanner({ replanData, onClose }) {
  if (!replanData) return null;

  const { urgent_task, bumped_task, action_type, description } = replanData;

  return (
    <div className="glass-panel p-4 mb-6 border-red-200 bg-red-50/80 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-red-100 text-red-600 border border-red-200 flex-shrink-0">
          <Zap className="w-5 h-5 fill-current" />
        </div>

        <div className="space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-red-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              Dynamic Schedule Replan Executed
            </h3>
            <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold bg-red-100 text-red-800 rounded border border-red-200">
              {action_type}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {description}
          </p>

          {bumped_task && (
            <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-red-200 flex flex-wrap items-center gap-2 text-slate-700 shadow-2xs">
              <span className="text-red-700 font-bold">⚡ Urgent:</span>
              <span className="text-slate-900 font-medium">{urgent_task?.task_text}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-amber-800 font-bold">Rescheduled:</span>
              <span className="text-slate-800">
                "{bumped_task?.task_text}" ➔ {bumped_task?.day_of_week} @ {bumped_task?.hour_slot}:00
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
