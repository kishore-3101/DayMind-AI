import React from 'react';
import { Calendar, CheckCircle, Trash2, Zap, Clock, TrendingUp, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function WeeklyCalendar({ calendarData, onToggleTask, onDeleteTask, onNavigateWeek, onSetToday, onSelectDate }) {
  if (!calendarData || !calendarData.calendar) {
    return (
      <div className="glass-panel p-8 text-center text-slate-500 font-medium">
        Loading ML date-based calendar schedule...
      </div>
    );
  }

  const { dates, work_hours, calendar, header_title } = calendarData;

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

  return (
    <div className="glass-panel p-5 mb-6">
      
      {/* Google Calendar Controls Top Bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              {header_title || 'Date-Based Schedule'}
            </h2>

            {/* Navigation Controls */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
              <button
                onClick={() => onNavigateWeek && onNavigateWeek(-7)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSetToday && onSetToday()}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
              >
                Today
              </button>

              <button
                onClick={() => onNavigateWeek && onNavigateWeek(7)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                title="Next Week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            💡 Click any date column header or task cell to open that specific date's Agenda View
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-purple-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Academic
          </span>
          <span className="flex items-center gap-1.5 text-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Work
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Health
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Learning
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[950px]">
          
          {/* Header Row with Exact Calendar Dates */}
          <div className="grid grid-cols-8 gap-2 mb-2 text-center text-xs font-bold">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Time Slot
            </div>

            {dates.map((d) => (
              <button
                key={d.date}
                type="button"
                onClick={() => onSelectDate && onSelectDate(d)}
                className={`p-2.5 rounded-xl border text-left transition transform hover:scale-[1.01] cursor-pointer flex flex-col justify-between ${
                  d.is_today
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-sm ring-1 ring-indigo-300'
                    : d.is_weekend
                    ? 'bg-purple-50/40 border-purple-100 text-purple-950 hover:border-purple-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    {d.day_name}
                  </span>
                  {d.is_today && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                      Today
                    </span>
                  )}
                </div>

                <div className="text-base font-extrabold font-mono mt-1 text-slate-900">
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
                <div className="p-2 text-xs font-semibold font-mono text-slate-600 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center">
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
                          ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {task ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate && onSelectDate(d);
                          }}
                          className={`h-full rounded-lg p-2 flex flex-col justify-between border shadow-2xs ${getCategoryColor(
                            task.category
                          )} ${task.completed ? 'opacity-60 line-through' : ''}`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs line-clamp-2 leading-tight text-slate-900">
                                {task.task_text}
                              </span>
                              {task.is_urgent === 1 && (
                                <span className="flex-shrink-0 text-red-600 font-bold" title="Urgent Task">
                                  <Zap className="w-3.5 h-3.5 fill-current" />
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-1 text-[10px]">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-white/70 font-semibold border border-black/5">
                                {task.category}
                              </span>
                              <span className="flex items-center gap-0.5 text-slate-600 font-medium">
                                <Clock className="w-2.5 h-2.5" />
                                ~{task.predicted_duration}m
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-black/10 text-[10px]">
                            {/* ML Confidence Score */}
                            <div
                              className="flex items-center gap-0.5 text-emerald-700 font-bold"
                              title="Random Forest predicted completion probability"
                            >
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
                              {Math.round(task.completion_prob * 100)}%
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleTask(task.id);
                                }}
                                className="p-0.5 hover:text-emerald-700 transition"
                                title={task.completed ? 'Mark Pending' : 'Mark Completed'}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTask(task.id);
                                }}
                                className="p-0.5 hover:text-red-700 transition"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-400 font-mono group-hover:text-slate-600">
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
