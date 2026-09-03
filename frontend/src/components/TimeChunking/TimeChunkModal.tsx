import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { TimeChunk, TimeChunkCategory } from '../../types';

interface TimeChunkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    category?: string;
    color?: string;
  }) => Promise<void>;
  initialData?: TimeChunk | null;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
}

const CATEGORIES: { label: string; value: TimeChunkCategory; color: string; icon: string }[] = [
  { label: 'Deep Focus', value: 'FOCUS', color: '#8B5CF6', icon: '⚡' },
  { label: 'Work', value: 'WORK', color: '#3B82F6', icon: '💼' },
  { label: 'Study & Research', value: 'STUDY', color: '#06B6D4', icon: '📚' },
  { label: 'Meeting', value: 'MEETING', color: '#F59E0B', icon: '👥' },
  { label: 'Break & Rest', value: 'BREAK', color: '#10B981', icon: '☕' },
  { label: 'Exercise', value: 'EXERCISE', color: '#EC4899', icon: '🏃' },
  { label: 'Other', value: 'OTHER', color: '#64748B', icon: '📌' },
];

export const TimeChunkModal: React.FC<TimeChunkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultStartTime,
  defaultEndTime,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<string>('FOCUS');
  const [color, setColor] = useState('#8B5CF6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStartTime(new Date(initialData.startTime).toISOString().slice(0, 16));
      setEndTime(new Date(initialData.endTime).toISOString().slice(0, 16));
      setCategory(initialData.category);
      setColor(initialData.color || '#8B5CF6');
    } else {
      const now = new Date();
      // Round to nearest 15 minutes
      const remainder = 15 - (now.getMinutes() % 15);
      const roundedStart = new Date(now.getTime() + remainder * 60 * 1000);
      const roundedEnd = new Date(roundedStart.getTime() + 45 * 60 * 1000); // 45m block

      const start = defaultStartTime ? new Date(defaultStartTime) : roundedStart;
      const end = defaultEndTime ? new Date(defaultEndTime) : roundedEnd;

      setTitle('');
      setDescription('');
      setStartTime(start.toISOString().slice(0, 16));
      setEndTime(end.toISOString().slice(0, 16));
      setCategory('FOCUS');
      setColor('#8B5CF6');
    }
    setError(null);
  }, [initialData, defaultStartTime, defaultEndTime, isOpen]);

  const handleCategorySelect = (catValue: string) => {
    setCategory(catValue);
    const found = CATEGORIES.find((c) => c.value === catValue);
    if (found) {
      setColor(found.color);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required for this time chunk');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        category,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save time chunk');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Time Chunk' : 'Block Out Time Chunk'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Focus Block Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep Work: Refactor Auth Pipeline"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                  category === cat.value
                    ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-slate-800 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes / Objectives
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specific deliverables or objectives for this chunk..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 text-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Chunk Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0"
            />
            <span className="text-xs text-slate-500">
              Customize visual block color for calendar & timeline
            </span>
          </div>
        </div>

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
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Block Out Time'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
