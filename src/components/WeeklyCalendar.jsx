import React from 'react';
import { Calendar, CheckCircle, Trash2, Zap, Clock, TrendingUp, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function WeeklyCalendar({ calendarData, onToggleTask, onDeleteTask, onNavigateWeek, onSetToday, onSelectDate }) {
  if (!calendarData || !calendarData.calendar) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        Loading ML date-based calendar schedule...
      </div>
    );
  }

  const { dates, work_hours, calendar, header_title } = calendarData;

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

  return (
    <div className="glass-panel p-5 mb-6">
      
      {/* Google Calendar Controls Top Bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-400" />
              {header_title || 'Date-Based Schedule'}
            </h2>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => onNavigateWeek && onNavigateWeek(-7)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSetToday && onSetToday()}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50 border border-indigo-400/40 transition"
              >
                Today
              </button>

              <button
                onClick={() => onNavigateWeek && onNavigateWeek(7)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            💡 Click any date column header or task cell to open that specific date's Agenda View
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Academic
          </span>
          <span className="flex items-center gap-1.5 text-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Work
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Health
          </span>
          <span className="flex items-center gap-1.5 text-pink-300">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Learning
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[950px]">
          
          {/* Header Row with Exact Calendar Dates */}
          <div className="grid grid-cols-8 gap-2 mb-2 text-center text-xs font-bold">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Time Slot
            </div>

            {dates.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => onSelectDate && onSelectDate(d)}
                className={`p-2.5 rounded-xl border text-left transition transform hover:scale-[1.02] cursor-pointer flex flex-col justify-between ${
                  d.is_today
                    ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-slate-900/60 border-indigo-400/70 text-white shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400/40'
                    : d.is_weekend
                    ? 'bg-purple-950/20 border-purple-500/20 text-purple-200 hover:border-purple-400/40'
                    : 'bg-white/5 border-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    {d.day_name}
                  </span>
                  {d.is_today && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 uppercase">
                      Today
                    </span>
                  )}
                </div>

                <div className="text-base font-extrabold font-mono mt-1 text-white">
                  {d.formatted}
                </div>
              </button>
            ))}
          </div>

          {/* Time Rows Grid */}
          <div className="space-y-2">
            {work_hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-2">
                
                {/* Time Label */}
                <div className="p-2 text-xs font-semibold font-mono text-slate-400 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center">
                  {formatHour(hour)}
                </div>

                {/* Date-specific Cells */}
                {dates.map((d) => {
                  const task = calendar[d.date] ? calendar[d.date][hour] : null;

                  return (
                    <div
                      key={`${d.date}-${hour}`}
                      onClick={() => !task && onSelectDate && onSelectDate(d)}
                      className={`min-h-[75px] rounded-xl border p-2 relative group transition cursor-pointer ${
                        d.is_today
                          ? 'border-indigo-500/20 bg-indigo-950/10 hover:border-indigo-400/40'
                          : 'border-white/5 bg-slate-950/40 hover:border-white/20'
                      }`}
                    >
                      {task ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate && onSelectDate(d);
                          }}
                          className={`h-full rounded-lg p-2 flex flex-col justify-between border ${getCategoryColor(
                            task.category
                          )} ${task.completed ? 'opacity-50 line-through' : ''}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs line-clamp-2 leading-tight">
                                {task.task_text}
                              </span>
                              {task.is_urgent === 1 && (
                                <span className="flex-shrink-0 text-red-400 animate-pulse" title="Urgent Task">
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-black/30 font-medium">
                                {task.category}
                              </span>
                              <span className="flex items-center gap-0.5 text-slate-300">
                                <Clock className="w-2.5 h-2.5" />
                                ~{task.predicted_duration}m
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[10px]">
                            {/* ML Confidence Score */}
                            <div
                              className="flex items-center gap-0.5 text-emerald-400 font-semibold"
                              title="Random Forest predicted completion probability"
                            >
                              <TrendingUp className="w-2.5 h-2.5" />
                              {Math.round(task.completion_prob * 100)}%
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTask(task.id);
                                }}
                                className="p-0.5 hover:text-emerald-400 transition"
                                title={task.completed ? 'Mark Pending' : 'Mark Completed'}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.id);
                                }}
                                className="p-0.5 hover:text-red-400 transition"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-mono group-hover:text-slate-400">
                          + Free Slot
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
