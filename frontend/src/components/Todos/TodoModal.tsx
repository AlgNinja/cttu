import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { Todo, Priority } from '../../types';
import { Clock, Calendar as CalendarIcon, Ban } from 'lucide-react';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string | null;
    dueDate?: string | null;
    allDay?: boolean;
    priority: Priority;
    completed?: boolean;
  }) => Promise<void>;
  initialData?: Todo | null;
  defaultDueDate?: string | null;
}

type DueOption = 'specific' | 'allDay' | 'none';

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultDueDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueOption, setDueOption] = useState<DueOption>('specific');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      if (initialData.dueDate) {
        if (initialData.allDay) {
          setDueOption('allDay');
          setDueDate(initialData.dueDate.slice(0, 10));
        } else {
          setDueOption('specific');
          const d = new Date(initialData.dueDate);
          const localStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDueDate(localStr);
        }
      } else {
        setDueOption('none');
        setDueDate('');
      }
      setPriority(initialData.priority);
      setCompleted(initialData.completed);
    } else if (defaultDueDate) {
      setTitle('');
      setDescription('');
      const hasTime = defaultDueDate.includes('T');
      if (hasTime) {
        setDueOption('specific');
        const d = new Date(defaultDueDate);
        const localStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setDueDate(localStr);
      } else {
        setDueOption('allDay');
        setDueDate(defaultDueDate.slice(0, 10));
      }
      setPriority('MEDIUM');
      setCompleted(false);
    } else {
      setTitle('');
      setDescription('');
      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
      setDueOption('specific');
      setDueDate(`${localDate}T23:59`);
      setPriority('MEDIUM');
      setCompleted(false);
    }
    setError(null);
  }, [initialData, defaultDueDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      let formattedDueDate: string | null = null;
      let finalAllDay = false;

      if (dueOption === 'allDay') {
        if (!dueDate) {
          setError('Please select a due date');
          setSubmitting(false);
          return;
        }
        finalAllDay = true;
        formattedDueDate = `${dueDate.slice(0, 10)}T12:00:00.000Z`;
      } else if (dueOption === 'specific') {
        if (!dueDate) {
          setError('Please select a due date and time');
          setSubmitting(false);
          return;
        }
        finalAllDay = false;
        formattedDueDate = new Date(dueDate).toISOString();
      } else {
        finalAllDay = false;
        formattedDueDate = null;
      }

      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        dueDate: formattedDueDate,
        allDay: finalAllDay,
        priority,
        completed,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save todo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Task / Todo' : 'New Task / Todo'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Submit quarterly report"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any relevant notes or checklists..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
          />
        </div>

        {/* Due Date Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Due Schedule
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setDueOption('specific');
                if (!dueDate || !dueDate.includes('T')) {
                  const d = dueDate ? dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
                  setDueDate(`${d}T23:59`);
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                dueOption === 'specific'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={14} />
              <span>Specific Time</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDueOption('allDay');
                if (dueDate && dueDate.includes('T')) {
                  setDueDate(dueDate.slice(0, 10));
                } else if (!dueDate) {
                  setDueDate(new Date().toISOString().slice(0, 10));
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                dueOption === 'allDay'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon size={14} />
              <span>All Day</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDueOption('none');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                dueOption === 'none'
                  ? 'bg-white text-slate-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ban size={14} />
              <span>No Due Date</span>
            </button>
          </div>
        </div>

        {/* Date Inputs depending on chosen mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dueOption === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date & Time (Exact Deadline)
              </label>
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>
          )}

          {dueOption === 'allDay' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Due Date (All Day)
              </label>
              <input
                type="date"
                required
                value={dueDate.slice(0, 10)}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>
          )}

          {dueOption === 'none' && (
            <div className="flex items-center text-xs text-slate-500 italic pt-6">
              This task has no deadline and will only appear in your task list.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm bg-white"
            >
              <option value="LOW">🟢 Low Priority</option>
              <option value="MEDIUM">🟡 Medium Priority</option>
              <option value="HIGH">🔴 High Priority</option>
            </select>
          </div>
        </div>

        {initialData && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="todoCompleted"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="todoCompleted" className="text-sm font-medium text-slate-700">
              Mark as completed
            </label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
