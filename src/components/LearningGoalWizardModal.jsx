import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Clock, ArrowRight, ArrowLeft, CheckCircle2, BookOpen, Flame, Tag, Layers, Check } from 'lucide-react';

export default function LearningGoalWizardModal({ isOpen, onClose, initialTopic, onBatchScheduleSuccess }) {
  const [step, setStep] = useState(1); // 1: Topic, 2: Days & Hours, 3: Roadmap Preview, 4: Success
  const [topic, setTopic] = useState(initialTopic || '');
  const [numDays, setNumDays] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [priority, setPriority] = useState('medium');
  const [timePreference, setTimePreference] = useState('Evening');
  
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
    { label: '☕ Learn Java', query: 'I need to learn Java' },
    { label: '🐍 Learn Python', query: 'Learn Python programming' },
    { label: '⚛️ Learn React', query: 'Master React & Web Dev' },
    { label: '⚡ DSA & Algorithms', query: 'Data Structures and Algorithms' },
    { label: '📊 Machine Learning', query: 'Machine Learning Fundamentals' },
    { label: '🗄️ SQL & Databases', query: 'Learn SQL & Database Querying' },
  ];

  const quickDays = [7, 14, 20, 30];
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
          priority: priority,
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

  const handleConfirmBatchSchedule = async () => {
    if (!modules || modules.length === 0) return;
    setIsScheduling(true);
    try {
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
    } catch (err) {
      console.error('Failed to batch schedule learning plan:', err);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setPlanData(null);
    setModules([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30 shadow-2xl shadow-purple-900/40">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Multi-Day Learning Planner & AI Roadmap
              </h2>
              <p className="text-xs text-slate-400">
                Step {step} of 3 • Custom goal, duration, hours budget & ML scheduling
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 flex">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: Topic Selection */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  1. What would you like to learn or accomplish?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. I need to learn Java, Master Python Data Science, Learn React..."
                  className="glass-input w-full text-base p-3 placeholder-slate-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2.5">
                  Popular Quick Templates:
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickTopics.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTopic(item.query)}
                      className={`text-xs px-3 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                        topic === item.query
                          ? 'bg-purple-600/40 text-purple-200 border-purple-400/60 shadow-lg shadow-purple-500/20'
                          : 'glass-card text-slate-300 hover:border-white/20 hover:bg-white/5'
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
                  className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50 flex items-center gap-2"
                >
                  Next: Schedule Parameters
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Duration, Hours, Priority & Time Pref */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs text-purple-300">
                <span className="font-semibold">Selected Topic:</span>
                <span className="font-bold text-white text-sm bg-purple-900/60 px-3 py-1 rounded-lg border border-purple-400/40">
                  {topic}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Number of Days */}
                <div className="glass-card p-4 space-y-3">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    Number of Days to Complete:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={numDays}
                      onChange={(e) => setNumDays(e.target.value)}
                      className="glass-input w-24 text-center font-mono font-bold text-base text-purple-200"
                    />
                    <span className="text-xs text-slate-400">days in total</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickDays.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setNumDays(d)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          Number(numDays) === d
                            ? 'bg-purple-600/40 border-purple-400 text-purple-200 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Hours Per Day */}
                <div className="glass-card p-4 space-y-3">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Available Time per Day:
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(e.target.value)}
                      className="glass-input text-xs font-bold text-purple-200 cursor-pointer"
                    >
                      <option value={0.5} className="bg-slate-900">0.5 hr / day (30 mins)</option>
                      <option value={1.0} className="bg-slate-900">1.0 hr / day (60 mins)</option>
                      <option value={1.5} className="bg-slate-900">1.5 hrs / day (90 mins)</option>
                      <option value={2.0} className="bg-slate-900">2.0 hrs / day (Deep Focus)</option>
                      <option value={3.0} className="bg-slate-900">3.0 hrs / day (Intensive)</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickHours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHoursPerDay(h)}
                        className={`text-xs px-2 py-1 rounded-lg border transition ${
                          Number(hoursPerDay) === h
                            ? 'bg-indigo-600/40 border-indigo-400 text-indigo-200 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {h}h/day
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="glass-card p-4 space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Priority Level:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'high', label: '🔴 High', style: 'border-red-500/50 text-red-300 bg-red-950/30' },
                      { key: 'medium', label: '🟡 Medium', style: 'border-amber-500/50 text-amber-300 bg-amber-950/30' },
                      { key: 'low', label: '🟢 Low', style: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/30' }
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPriority(p.key)}
                        className={`py-2 rounded-xl border text-xs font-bold transition ${
                          priority === p.key ? p.style + ' shadow-md' : 'bg-white/5 border-white/10 text-slate-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Study Window */}
                <div className="glass-card p-4 space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    Preferred Study Time Window:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'Morning', label: '☀️ Morning (7AM-12PM)' },
                      { id: 'Afternoon', label: '🌤️ Afternoon (12PM-5PM)' },
                      { id: 'Evening', label: '🌙 Evening (5PM-9PM)' },
                      { id: 'Night', label: '🌌 Night (8PM-11PM)' }
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setTimePreference(w.id)}
                        className={`py-1.5 px-2 rounded-lg border text-left transition ${
                          timePreference === w.id
                            ? 'bg-purple-600/40 border-purple-400 text-white font-bold'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-purple-300" />
                      Generating AI Syllabus...
                    </>
                  ) : (
                    <>
                      Generate AI Learning Roadmap
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Roadmap Preview & Editing */}
          {step === 3 && planData && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Summary Stats Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900/60 border border-purple-500/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-[10px] text-purple-300 uppercase font-semibold">Total Commitment</div>
                  <div className="text-xl font-extrabold text-white font-mono">{planData.total_hours} hrs</div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 uppercase font-semibold">Duration</div>
                  <div className="text-xl font-extrabold text-purple-200 font-mono">{planData.num_days} Days</div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 uppercase font-semibold">Daily Hours</div>
                  <div className="text-xl font-extrabold text-indigo-300 font-mono">{planData.hours_per_day} h / day</div>
                </div>
                <div>
                  <div className="text-[10px] text-purple-300 uppercase font-semibold">Finish Target</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">{planData.target_finish_date}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-400" />
                    Generated AI Daily Syllabus Checklist ({modules.length} Modules):
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    💡 Click any title to customize your daily focus
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-white/10 rounded-xl p-2 bg-slate-950/50">
                  {modules.map((mod, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-purple-500/30 transition flex items-center gap-3"
                    >
                      <span className="w-7 h-7 rounded-lg bg-purple-900/50 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                        D{mod.day_number}
                      </span>

                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => handleModuleTitleChange(idx, e.target.value)}
                        className="glass-input text-xs w-full text-white bg-transparent border-transparent hover:border-white/20 focus:border-purple-500 focus:bg-slate-900"
                      />

                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 flex-shrink-0">
                        {mod.target_day} ({mod.estimated_duration}m)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Adjust Parameters
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBatchSchedule}
                  disabled={isScheduling}
                  className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  {isScheduling ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Scheduling {modules.length} Tasks with ML...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm & Schedule All {modules.length} Days with ML
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-xl font-bold text-white">
                Multi-Day Learning Schedule Activated!
              </h3>

              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your <strong className="text-purple-300">{numDays}-day plan for "{topic}"</strong> ({hoursPerDay}h/day) has been scheduled across your calendar using ML optimization.
              </p>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="btn-primary text-sm px-6 py-2.5"
                >
                  View Updated Calendar & Schedule
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
