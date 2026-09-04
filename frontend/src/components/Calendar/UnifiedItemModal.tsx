import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { UnifiedCalendarItem, Todo, CalendarEvent, TimeChunk, Priority } from '../../types';
import { Trash2, CheckCircle2, Circle, Clock, MapPin, Tag } from 'lucide-react';
import { toLocalDatetime } from '../../utils/overlap';

interface UnifiedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UnifiedCalendarItem | null;
  onUpdateTodo: (id: string, data: Partial<Todo>) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onToggleTodo: (id: string) => Promise<void>;
  onUpdateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onUpdateTimeChunk: (id: string, data: Partial<TimeChunk>) => Promise<void>;
  onDeleteTimeChunk: (id: string) => Promise<void>;
  onToggleTimeChunk: (id: string) => Promise<void>;
}

export const UnifiedItemModal: React.FC<UnifiedItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onUpdateTodo,
  onDeleteTodo,
  onToggleTodo,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateTimeChunk,
  onDeleteTimeChunk,
  onToggleTimeChunk,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [category, setCategory] = useState('FOCUS');
  const [color, setColor] = useState('#3B82F6');

  useEffect(() => {
    if (item) {
      setIsEditing(false);
      setError(null);
      setTitle(item.title.replace(/^[✓☐\s]+/, '').replace(/^⚡\s*\[.*?\]\s*/, ''));
      setDescription(item.description || '');
      setStartDate(item.start ? toLocalDatetime(item.start) : '');
      setEndDate(item.end ? toLocalDatetime(item.end) : '');
      setAllDay(item.allDay);
      setColor(item.color);

      if (item.type === 'todo') {
        const raw = item.raw as Todo;
        setPriority(raw.priority);
      } else if (item.type === 'event') {
        const raw = item.raw as CalendarEvent;
        setLocation(raw.location || '');
      } else if (item.type === 'timeChunk') {
        const raw = item.raw as TimeChunk;
        setCategory(raw.category);
      }
    }
  }, [item, isOpen]);

  if (!item) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      if (item.type === 'todo') {
        let formattedDueDate: string | null = null;
        if (startDate) {
          formattedDueDate = allDay
            ? `${startDate.slice(0, 10)}T12:00:00.000Z`
            : new Date(startDate).toISOString();
        }
        await onUpdateTodo(item.originalId, {
          title,
          description: description || null,
          dueDate: formattedDueDate,
          allDay,
          priority,
        });
      } else if (item.type === 'event') {
        await onUpdateEvent(item.originalId, {
          title,
          description: description || null,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          allDay,
          location: location || null,
          color,
        });
      } else if (item.type === 'timeChunk') {
        await onUpdateTimeChunk(item.originalId, {
          title,
          description: description || null,
          startTime: new Date(startDate).toISOString(),
          endTime: new Date(endDate).toISOString(),
          category,
          color,
        });
      }

      setIsEditing(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${item.type}?`)) return;
    try {
      setSubmitting(true);
      if (item.type === 'todo') await onDeleteTodo(item.originalId);
      else if (item.type === 'event') await onDeleteEvent(item.originalId);
      else if (item.type === 'timeChunk') await onDeleteTimeChunk(item.originalId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    try {
      if (item.type === 'todo') await onToggleTodo(item.originalId);
      else if (item.type === 'timeChunk') await onToggleTimeChunk(item.originalId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status');
    }
  };

  const typeBadge = {
    todo: { label: 'Task / Todo', bg: 'bg-amber-100 text-amber-800' },
    event: { label: 'Event', bg: 'bg-blue-100 text-blue-800' },
    timeChunk: { label: 'Time Chunk', bg: 'bg-purple-100 text-purple-800' },
  }[item.type];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit ${typeBadge.label}` : `${typeBadge.label} Details`}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {!isEditing ? (
        <div className="space-y-5">
          {/* Header row with badges */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${typeBadge.bg}`}
            >
              {typeBadge.label}
            </span>

            {(item.type === 'todo' || item.type === 'timeChunk') && (
              <button
                type="button"
                onClick={handleToggle}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
              >
                {item.completed ? (
                  <>
                    <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-50" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle size={15} />
                    Mark Done
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm text-slate-600 whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100">
                {description}
              </p>
            )}
          </div>

          <div className="space-y-2.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400 shrink-0" />
              <span>
                {item.type === 'todo' ? (
                  item.allDay ? (
                    `All Day • ${new Date((item.raw as Todo)?.dueDate || item.start).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  ) : (
                    `Due: ${new Date((item.raw as Todo)?.dueDate || item.start).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  )
                ) : item.allDay ? (
                  `All Day • ${new Date(item.start).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                ) : (
                  `${new Date(item.start).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })} - ${new Date(item.end).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                )}
              </span>
            </div>

            {item.type === 'event' && item.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span>{item.location}</span>
              </div>
            )}

            {item.type === 'todo' && item.priority && (
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium">Priority: {item.priority}</span>
              </div>
            )}

            {item.type === 'timeChunk' && item.category && (
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-slate-400 shrink-0" />
                <span className="font-medium">Category: {item.category}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                Edit Item
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Form */
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {item.type === 'todo' && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="unifiedTodoAllDay"
                  checked={allDay}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setAllDay(isChecked);
                    if (startDate) {
                      setStartDate(isChecked ? startDate.slice(0, 10) : `${startDate.slice(0, 10)}T09:00`);
                    }
                  }}
                  className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="unifiedTodoAllDay" className="text-sm font-medium text-slate-700">
                  Due all day (no specific time)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {allDay ? 'Due Date' : 'Due Date & Time'}
                  </label>
                  <input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={allDay ? startDate.slice(0, 10) : startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {item.type === 'event' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </>
          )}

          {item.type === 'timeChunk' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden bg-white"
                >
                  <option value="FOCUS">⚡ Deep Focus</option>
                  <option value="WORK">💼 Work</option>
                  <option value="STUDY">📚 Study</option>
                  <option value="MEETING">👥 Meeting</option>
                  <option value="BREAK">☕ Break</option>
                  <option value="EXERCISE">🏃 Exercise</option>
                  <option value="OTHER">📌 Other</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
