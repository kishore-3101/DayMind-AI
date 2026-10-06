import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Flame, Tag, Check, Zap } from 'lucide-react';

export default function LearningGoalWizardModal({ isOpen, onClose, initialTopic, onBatchScheduleSuccess }) {
  const [step, setStep] = useState(1); // 1: Topic/Goal, 2: Parameters, 3: Syllabus Preview, 4: Success
  const [topic, setTopic] = useState(initialTopic || '');
  const [numDays, setNumDays] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [priority, setPriority] = useState('medium');
  const [timePreference, setTimePreference] = useState('Evening');
  const [isUrgent, setIsUrgent] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  if (!isOpen) return null;

  const quickTopics = [
    { label: 'Learn Java', query: 'I need to learn Java' },
    { label: 'Learn Python', query: 'Learn Python programming' },
    { label: 'Learn React', query: 'Master React & Web Dev' },
    { label: 'DSA & Algorithms', query: 'Data Structures and Algorithms' },
    { label: 'Machine Learning', query: 'Machine Learning Fundamentals' },
    { label: 'SQL & Databases', query: 'Learn SQL & Database Querying' },
  ];

  const quickDays = [1, 7, 14, 20, 30];
  const quickHours = [0.5, 1.0, 1.5, 2.0, 3.0];

  const handleGeneratePlan = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          num_days: Number(numDays),
          hours_per_day: Number(hoursPerDay),
          priority: isUrgent ? 'high' : priority,
          time_preference: timePreference
        })
      });
      const data = await res.json();
      setPlanData(data);
      setModules(data.modules || []);
      setStep(3);
    } catch (err) {
      console.error('Failed to generate learning plan:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModuleTitleChange = (index, newTitle) => {
    const updated = [...modules];
    updated[index].title = newTitle;
    setModules(updated);
  };

  const handleConfirmSchedule = async () => {
    if (!modules || modules.length === 0) return;
    setIsScheduling(true);
    try {
      if (isUrgent) {
        // Execute Urgent Dynamic Replanning
        const res = await fetch('/api/tasks/urgent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_text: topic,
            num_days: Number(numDays),
            hours_per_day: Number(hoursPerDay),
            category: planData?.category || 'learning',
            time_preference: timePreference
          })
        });
        const data = await res.json();
        setStep(4);
        if (onBatchScheduleSuccess) {
          onBatchScheduleSuccess(data);
        }
      } else {
        // Standard ML batch schedule
        const res = await fetch('/api/tasks/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic,
            priority: priority,
            time_preference: timePreference,
            modules: modules
          })
        });
        const data = await res.json();
        setStep(4);
        if (onBatchScheduleSuccess) {
          onBatchScheduleSuccess(data);
        }
      }
    } catch (err) {
      console.error('Failed to schedule plan:', err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setPlanData(null);
    setModules([]);
    setIsUrgent(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-slate-200 shadow-xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Create Goal or Task Roadmap
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 3 • Set your objective, duration, hours budget, and priority
            </p>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-slate-100 h-1 flex">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* STEP 1: Topic / Goal Input */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  What is your learning goal or task objective?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Master Python Data Science, Learn React, Prepare ML Assignment..."
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-900 placeholder-slate-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Quick Templates:
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickTopics.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(item.query)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                        topic === item.query
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!topic.trim()}
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <span>Next: Schedule Parameters</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Parameters & Urgent Replan Toggle */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Objective:</span>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  {topic}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Number of Days */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Duration (Days):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={numDays}
                      onChange={(e) => setNumDays(e.target.value)}
                      className="w-20 text-center font-mono font-bold text-sm p-1.5 border border-slate-300 rounded-lg text-slate-900"
                    />
                    <span className="text-xs text-slate-500">{Number(numDays) === 1 ? 'day (Single Task)' : 'days total'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {quickDays.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNumDays(d)}
                        className={`text-xs px-2 py-1 rounded-md border transition cursor-pointer ${
                          Number(numDays) === d
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {d} {d === 1 ? 'Day' : 'Days'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hours Per Day */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Daily Time Budget:
                  </label>
                  <div>
                    <select
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-900 p-2 border border-slate-300 rounded-lg bg-white cursor-pointer"
                    >
                      <option value={0.5}>0.5 hr / day (30 mins)</option>
                      <option value={1.0}>1.0 hr / day (60 mins)</option>
                      <option value={1.5}>1.5 hrs / day (Standard)</option>
                      <option value={2.0}>2.0 hrs / day (Deep Focus)</option>
                      <option value={3.0}>3.0 hrs / day (Intensive)</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {quickHours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHoursPerDay(h)}
                        className={`text-xs px-2 py-0.5 rounded-md border transition cursor-pointer ${
                          Number(hoursPerDay) === h
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {h}h/day
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Priority Level:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'high', label: 'High', style: 'border-red-200 text-red-700 bg-red-50' },
                      { key: 'medium', label: 'Medium', style: 'border-amber-200 text-amber-800 bg-amber-50' },
                      { key: 'low', label: 'Low', style: 'border-emerald-200 text-emerald-800 bg-emerald-50' }
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        disabled={isUrgent}
                        onClick={() => setPriority(p.key)}
                        className={`py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                          (isUrgent && p.key === 'high') || (!isUrgent && priority === p.key)
                            ? p.style
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Study Window */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    Target Time Window:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'Morning', label: '☀️ Morning' },
                      { id: 'Afternoon', label: '🌤️ Afternoon' },
                      { id: 'Evening', label: '🌙 Evening' },
                      { id: 'Night', label: '🌌 Night' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setTimePreference(w.id)}
                        className={`py-1.5 px-2 rounded-md border text-left font-medium transition cursor-pointer ${
                          timePreference === w.id
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* DYNAMIC URGENT REPLANNING TOGGLE CARD */}
              <div className={`p-4 rounded-xl border transition ${
                isUrgent ? 'border-red-300 bg-red-50/70' : 'border-slate-200 bg-slate-50/60'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => {
                      setIsUrgent(e.target.checked);
                      if (e.target.checked) setPriority('high');
                    }}
                    className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <Zap className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-600 fill-current' : 'text-slate-400'}`} />
                        Enable Dynamic Urgent Replanning
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                          Urgent Mode Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Automatically schedules this goal with immediate top priority. If calendar slots are occupied, existing lower-priority tasks will be bumped and dynamically rescheduled to alternate slots.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isGenerating ? 'Generating Roadmap...' : 'Generate Roadmap →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Roadmap Preview & Editing */}
          {step === 3 && planData && (
            <div className="space-y-4">
              
              {/* Summary Stats */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Commitment</div>
                  <div className="text-base font-bold text-slate-900 font-mono">{planData.total_hours} hrs</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Duration</div>
                  <div className="text-base font-bold text-slate-900 font-mono">{planData.num_days} Days</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Daily Budget</div>
                  <div className="text-base font-bold text-slate-900 font-mono">{planData.hours_per_day} h / day</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Target Finish</div>
                  <div className="text-xs font-bold text-emerald-700 mt-1">{planData.target_finish_date}</div>
                </div>
              </div>

              {isUrgent && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2 font-medium">
                  <Zap className="w-4 h-4 text-red-600 flex-shrink-0 fill-current" />
                  <span>Dynamic Urgent Replanning will take effect upon confirmation.</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Daily Syllabus Checklist ({modules.length} Modules):
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Editable module titles
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {modules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition flex items-center gap-2 text-xs"
                    >
                      <span className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        D{mod.day_number}
                      </span>

                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => handleModuleTitleChange(idx, e.target.value)}
                        className="text-xs w-full text-slate-900 p-1 bg-transparent border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded"
                      />

                      <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-100 flex-shrink-0 font-medium">
                        {mod.target_day} ({mod.estimated_duration}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Adjust Parameters
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSchedule}
                  disabled={isScheduling}
                  className={`px-5 py-2 rounded-lg text-white font-medium text-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs ${
                    isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isScheduling ? (
                    'Scheduling Plan...'
                  ) : isUrgent ? (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Confirm & Dynamically Replan ({modules.length} Days)
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Schedule All {modules.length} Days
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                {isUrgent ? 'Dynamic Urgent Replanning Complete!' : 'Goal Roadmap Scheduled!'}
              </h3>

              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your <strong className="text-indigo-700 font-semibold">{numDays}-day schedule for "{topic}"</strong> has been optimized and assigned across calendar slots.
              </p>

              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs cursor-pointer"
                >
                  View Updated Calendar & To-Do List
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
