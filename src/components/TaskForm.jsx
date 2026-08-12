import React, { useState, useEffect } from 'react';
import { PlusCircle, Zap, Tag, Clock, Calendar as CalendarIcon, Sparkles, Layers, CalendarRange } from 'lucide-react';

export default function TaskForm({ onAddTask, onAddUrgentTask, onOpenLearningWizard, isSubmitting }) {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('medium');
  const [duration, setDuration] = useState(45);
  const [preferredDay, setPreferredDay] = useState('');

  // Multi-day Learning Goal state
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [numDays, setNumDays] = useState(20);
  const [hoursPerDay, setHoursPerDay] = useState(1.0);
  
  // Live NLP & Decomposition Preview state
  const [nlpCategory, setNlpCategory] = useState(null);
  const [nlpConfidence, setNlpConfidence] = useState(null);
  const [decomposition, setDecomposition] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Auto-detect learning goal intent
  const isLearningIntent = taskText.toLowerCase().includes('learn') || 
                           taskText.toLowerCase().includes('study') || 
                           taskText.toLowerCase().includes('course') || 
                           nlpCategory === 'learning';

  // Debounced NLP & Decomposition parsing
  useEffect(() => {
    if (!taskText.trim() || taskText.length < 3) {
      setNlpCategory(null);
      setNlpConfidence(null);
      setDecomposition(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsPredicting(true);
      try {
        const res = await fetch('/api/predict-nlp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_text: taskText,
            num_days: isMultiDay ? Number(numDays) : null,
            hours_per_day: isMultiDay ? Number(hoursPerDay) : null
          })
        });
        const data = await res.json();
        setNlpCategory(data.category);
        setNlpConfidence(data.confidence);
        setDecomposition(data.decomposition);

        // Auto-enable multi-day if detected from prompt text
        if (data.decomposition && data.decomposition.type === 'multi_day') {
          setIsMultiDay(true);
          if (data.decomposition.count) setNumDays(data.decomposition.count);
          if (data.decomposition.duration) setHoursPerDay(data.decomposition.duration / 60);
        }
      } catch (err) {
        console.error('NLP preview failed:', err);
      } finally {
        setIsPredicting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [taskText, isMultiDay, numDays, hoursPerDay]);

  const handleSubmitNormal = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    onAddTask({
      task_text: taskText,
      priority: decomposition?.priority || priority,
      estimated_duration: isMultiDay ? Math.round(Number(hoursPerDay) * 60) : Number(duration),
      preferred_day: decomposition?.target_day || preferredDay || null,
      category: nlpCategory,
      num_days: isMultiDay ? Number(numDays) : null,
      hours_per_day: isMultiDay ? Number(hoursPerDay) : null
    });
    setTaskText('');
  };

  const handleSubmitUrgent = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    onAddUrgentTask({
      task_text: taskText,
      estimated_duration: isMultiDay ? Math.round(Number(hoursPerDay) * 60) : Number(duration),
      preferred_day: decomposition?.target_day || preferredDay || null,
      category: nlpCategory,
      num_days: isMultiDay ? Number(numDays) : null,
      hours_per_day: isMultiDay ? Number(hoursPerDay) : null
    });
    setTaskText('');
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'academic': return 'badge-academic';
      case 'work': return 'badge-work';
      case 'health': return 'badge-health';
      case 'personal': return 'badge-personal';
      case 'learning': return 'badge-learning';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Concern & Task Scheduler
        </h2>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Launch Learning Goal Wizard Button */}
          <button
            type="button"
            onClick={() => onOpenLearningWizard && onOpenLearningWizard(taskText)}
            className="px-3 py-1.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 border border-purple-400/40 flex items-center gap-1.5 transition transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            + Learning Goal Wizard
          </button>

          {/* AI Decomposition Badge */}
          {decomposition && (
            <span className="px-3 py-1 rounded-full font-semibold bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1.5 animate-pulse">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              {decomposition.type === 'multi_day'
                ? `Multi-Day Plan: ${decomposition.count} Daily Slots (${decomposition.duration}m/day)`
                : `Auto-Splitting into ${decomposition.count} Slots (${decomposition.duration}m each)`}
            </span>
          )}

          {/* NLP Category Badge */}
          {nlpCategory && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">NLP Category:</span>
              <span className={`px-2.5 py-1 rounded-full font-medium capitalize flex items-center gap-1.5 ${getCategoryBadgeClass(nlpCategory)}`}>
                <Tag className="w-3 h-3" />
                {nlpCategory}
                <span className="opacity-75 font-mono text-[10px]">
                  ({Math.round(nlpConfidence * 100)}%)
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      <form className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              What is your concern or learning goal?
            </label>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMultiDay(!isMultiDay)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                  isMultiDay
                    ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/20'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                {isMultiDay ? 'Multi-Day Learning Plan Active' : '+ Quick Multi-Day Controls'}
              </button>
            </div>
          </div>

          <input
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="e.g. I need to learn Java, Master Python Data Science, or Finish ML assignment..."
            className="glass-input w-full text-sm placeholder-slate-500"
          />

          {/* Learning Goal Detection Banner */}
          {isLearningIntent && (
            <div className="mt-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between animate-fadeIn text-xs text-purple-200">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Learning goal detected! Want to set number of days, daily hours budget & priority?
              </span>
              <button
                type="button"
                onClick={() => onOpenLearningWizard && onOpenLearningWizard(taskText)}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/30 flex items-center gap-1"
              >
                Open Learning Goal Wizard →
              </button>
            </div>
          )}
        </div>

        {/* Multi-Day Planning Controls */}
        {isMultiDay ? (
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5" />
                Number of Days
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={numDays}
                onChange={(e) => setNumDays(e.target.value)}
                className="glass-input w-full text-xs font-mono font-bold text-purple-200"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Available Time per Day
              </label>
              <select
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer text-purple-200"
              >
                <option value={0.5} className="bg-slate-900">30 mins / day</option>
                <option value={1.0} className="bg-slate-900">1 hour / day (Standard)</option>
                <option value={1.5} className="bg-slate-900">1.5 hours / day</option>
                <option value={2.0} className="bg-slate-900">2 hours / day (Deep Focus)</option>
                <option value={3.0} className="bg-slate-900">3 hours / day</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer"
              >
                <option value="high" className="bg-slate-900 text-red-400">🔴 High Priority</option>
                <option value="medium" className="bg-slate-900 text-amber-400">🟡 Medium Priority</option>
                <option value="low" className="bg-slate-900 text-emerald-400">🟢 Low Priority</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer"
              >
                <option value="high" className="bg-slate-900 text-red-400">🔴 High Priority</option>
                <option value="medium" className="bg-slate-900 text-amber-400">🟡 Medium Priority</option>
                <option value="low" className="bg-slate-900 text-emerald-400">🟢 Low Priority</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Estimated Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer"
              >
                <option value={15} className="bg-slate-900">15 mins (Quick)</option>
                <option value={30} className="bg-slate-900">30 mins</option>
                <option value={45} className="bg-slate-900">45 mins (Standard)</option>
                <option value={60} className="bg-slate-900">1 hour</option>
                <option value={90} className="bg-slate-900">1.5 hours</option>
                <option value={120} className="bg-slate-900">2 hours (Deep Work)</option>
              </select>
            </div>

            {/* Preferred Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                Target Day
              </label>
              <select
                value={preferredDay}
                onChange={(e) => setPreferredDay(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer"
              >
                <option value="" className="bg-slate-900">✨ Auto (ML Best Slot)</option>
                <option value="Mon" className="bg-slate-900">Monday</option>
                <option value="Tue" className="bg-slate-900">Tuesday</option>
                <option value="Wed" className="bg-slate-900">Wednesday</option>
                <option value="Thu" className="bg-slate-900">Thursday</option>
                <option value="Fri" className="bg-slate-900">Friday</option>
                <option value="Sat" className="bg-slate-900">Saturday</option>
                <option value="Sun" className="bg-slate-900">Sunday</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmitNormal}
            disabled={!taskText.trim() || isSubmitting}
            className="btn-primary w-full sm:w-auto text-xs disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            {isMultiDay
              ? `Schedule ${numDays}-Day Plan (${hoursPerDay}h/day)`
              : decomposition
              ? `Schedule ${decomposition.count} Slots with ML`
              : 'Schedule with ML'}
          </button>

          <button
            type="button"
            onClick={handleSubmitUrgent}
            disabled={!taskText.trim() || isSubmitting}
            className="btn-urgent w-full sm:w-auto text-xs disabled:opacity-50"
            title="Adds task immediately as urgent and performs dynamic schedule replanning"
          >
            <Zap className="w-4 h-4 fill-current" />
            {isMultiDay
              ? `Add Urgent (${numDays}-Day Plan Replan)`
              : decomposition
              ? `Add Urgent (${decomposition.count} Slots Replan)`
              : 'Add Urgent (Dynamic Replan)'}
          </button>
        </div>
      </form>
    </div>
  );
}
