import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { CalendarEvent } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    location?: string | null;
    color?: string;
  }) => Promise<void>;
  initialData?: CalendarEvent | null;
  defaultStartDate?: string | null;
  defaultEndDate?: string | null;
}

const COLOR_PRESETS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Cyan', hex: '#06B6D4' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultStartDate,
  defaultEndDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setStartDate(new Date(initialData.startDate).toISOString().slice(0, 16));
      setEndDate(new Date(initialData.endDate).toISOString().slice(0, 16));
      setAllDay(initialData.allDay);
      setLocation(initialData.location || '');
      setColor(initialData.color || '#3B82F6');
    } else {
      const defaultStart = defaultStartDate
        ? new Date(defaultStartDate)
        : new Date();
      const defaultEnd = defaultEndDate
        ? new Date(defaultEndDate)
        : new Date(defaultStart.getTime() + 60 * 60 * 1000); // 1 hour default

      setTitle('');
      setDescription('');
      setStartDate(defaultStart.toISOString().slice(0, 16));
      setEndDate(defaultEnd.toISOString().slice(0, 16));
      setAllDay(false);
      setLocation('');
      setColor('#3B82F6');
    }
    setError(null);
  }, [initialData, defaultStartDate, defaultEndDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Event title is required');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setError('End date cannot be earlier than start date');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        allDay,
        location: location.trim() || null,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Event' : 'Schedule New Event'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Sync & Review"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
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
            placeholder="Meeting link, agenda, or location notes..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="eventAllDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="eventAllDay" className="text-sm font-medium text-slate-700">
            All-day event
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type={allDay ? 'date' : 'datetime-local'}
              required
              value={allDay ? startDate.slice(0, 10) : startDate}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(allDay ? `${val}T00:00` : val);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type={allDay ? 'date' : 'datetime-local'}
              required
              value={allDay ? endDate.slice(0, 10) : endDate}
              onChange={(e) => {
                const val = e.target.value;
                setEndDate(allDay ? `${val}T23:59` : val);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Location / Link
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Zoom / Conference Room A"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Event Color
          </label>
          <div className="flex items-center gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.hex}
                onClick={() => setColor(preset.hex)}
                style={{ backgroundColor: preset.hex }}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === preset.hex ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                }`}
                title={preset.name}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded-full border-0 cursor-pointer p-0 ml-2"
              title="Custom color"
            />
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
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            {submitting ? 'Saving...' : initialData ? 'Save Changes' : 'Schedule Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
