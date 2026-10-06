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
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          AI Concern & Task Scheduler
        </h2>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Launch Learning Goal Wizard Button */}
          <button
            type="button"
            onClick={() => onOpenLearningWizard && onOpenLearningWizard(taskText)}
            className="px-3 py-1.5 rounded-xl font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            + Learning Goal Wizard
          </button>

          {/* AI Decomposition Badge */}
          {decomposition && (
            <span className="px-3 py-1 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              {decomposition.type === 'multi_day'
                ? `Multi-Day Plan: ${decomposition.count} Daily Slots (${decomposition.duration}m/day)`
                : `Auto-Splitting into ${decomposition.count} Slots (${decomposition.duration}m each)`}
            </span>
          )}

          {/* NLP Category Badge */}
          {nlpCategory && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">NLP Category:</span>
              <span className={`px-2.5 py-1 rounded-full font-semibold capitalize flex items-center gap-1.5 ${getCategoryBadgeClass(nlpCategory)}`}>
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
            <label className="text-xs font-semibold text-slate-700">
              What is your concern or learning goal?
            </label>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMultiDay(!isMultiDay)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                  isMultiDay
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
            className="glass-input w-full text-sm placeholder-slate-400"
          />

          {/* Learning Goal Detection Banner */}
          {isLearningIntent && (
            <div className="mt-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs text-indigo-900">
              <span className="flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Learning goal detected! Set number of days, daily hours budget & priority?
              </span>
              <button
                type="button"
                onClick={() => onOpenLearningWizard && onOpenLearningWizard(taskText)}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1"
              >
                Open Learning Goal Wizard →
              </button>
            </div>
          )}
        </div>

        {/* Multi-Day Planning Controls */}
        {isMultiDay ? (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5 text-indigo-600" />
                Number of Days
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={numDays}
                onChange={(e) => setNumDays(e.target.value)}
                className="glass-input w-full text-xs font-mono font-bold text-slate-900"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Available Time per Day
              </label>
              <select
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer text-slate-900 bg-white"
              >
                <option value={0.5}>30 mins / day</option>
                <option value={1.0}>1 hour / day (Standard)</option>
                <option value={1.5}>1.5 hours / day</option>
                <option value={2.0}>2 hours / day (Deep Focus)</option>
                <option value={3.0}>3 hours / day</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer text-slate-900 bg-white"
              >
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer text-slate-900 bg-white"
              >
                <option value="high">🔴 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Estimated Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer text-slate-900 bg-white"
              >
                <option value={15}>15 mins (Quick)</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins (Standard)</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours (Deep Work)</option>
              </select>
            </div>

            {/* Preferred Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                Target Day
              </label>
              <select
                value={preferredDay}
                onChange={(e) => setPreferredDay(e.target.value)}
                className="glass-input w-full text-xs cursor-pointer text-slate-900 bg-white"
              >
                <option value="">✨ Auto (ML Best Slot)</option>
                <option value="Mon">Monday</option>
                <option value="Tue">Tuesday</option>
                <option value="Wed">Wednesday</option>
                <option value="Thu">Thursday</option>
                <option value="Fri">Friday</option>
                <option value="Sat">Saturday</option>
                <option value="Sun">Sunday</option>
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
