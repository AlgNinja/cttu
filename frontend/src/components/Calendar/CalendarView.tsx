import React, { useState, useMemo, useCallback, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  UnifiedCalendarItem,
  Todo,
  CalendarEvent,
  TimeChunk,
} from '../../types';
import { UnifiedItemModal } from './UnifiedItemModal';
import { TodoModal } from '../Todos/TodoModal';
import { EventModal } from '../Events/EventModal';
import { TimeChunkModal } from '../TimeChunking/TimeChunkModal';
import { Modal } from '../Common/Modal';
import { ErrorBoundary } from '../Common/ErrorBoundary';
import { CheckSquare, Square, Calendar as CalendarIcon, Zap, Plus, AlertCircle, X } from 'lucide-react';
import { findConflictingItem, formatTimeRange } from '../../utils/overlap';

interface CalendarViewProps {
  items: UnifiedCalendarItem[];
  loading: boolean;
  onUpdateTodo: (id: string, data: Partial<Todo>) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onToggleTodo: (id: string) => Promise<void>;
  onCreateTodo: (data: any) => Promise<void>;
  onUpdateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onCreateEvent: (data: any) => Promise<void>;
  onUpdateTimeChunk: (id: string, data: Partial<TimeChunk>) => Promise<void>;
  onDeleteTimeChunk: (id: string) => Promise<void>;
  onToggleTimeChunk: (id: string) => Promise<void>;
  onCreateTimeChunk: (data: any) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  loading: _loading,
  onUpdateTodo,
  onDeleteTodo,
  onToggleTodo,
  onCreateTodo,
  onUpdateEvent,
  onDeleteEvent,
  onCreateEvent,
  onUpdateTimeChunk,
  onDeleteTimeChunk,
  onToggleTimeChunk,
  onCreateTimeChunk,
}) => {
  // Visibility filters
  const [showTodos, setShowTodos] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showTimeChunks, setShowTimeChunks] = useState(true);

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState<UnifiedCalendarItem | null>(null);

  // Drag-to-select range or clicked slot
  const [selectedRange, setSelectedRange] = useState<{
    start: Date;
    end: Date;
    startStr: string;
    endStr: string;
    allDay: boolean;
  } | null>(null);

  // Overlap conflict alert message
  const [overlapAlert, setOverlapAlert] = useState<string | null>(null);

  // Slot click create choice modal
  const [slotChoiceModalOpen, setSlotChoiceModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | null>(null);

  // Specific creation modals
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [timeChunkModalOpen, setTimeChunkModalOpen] = useState(false);

  // Auto-dismiss overlap alert after 6 seconds
  useEffect(() => {
    if (!overlapAlert) return;
    const timer = setTimeout(() => {
      setOverlapAlert(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [overlapAlert]);

  // Filter items (memoized to prevent re-render thrashing)
  const calendarEvents = useMemo(() => {
    return items
      .filter((item) => {
        if (item.type === 'todo' && !showTodos) return false;
        if (item.type === 'event' && !showEvents) return false;
        if (item.type === 'timeChunk' && !showTimeChunks) return false;
        return true;
      })
      .map((item) => {
        const itemColor =
          item.color ||
          (item.type === 'todo'
            ? '#F59E0B'
            : item.type === 'event'
            ? '#3B82F6'
            : '#8B5CF6');

        if (item.type === 'todo') {
          if (item.allDay) {
            return {
              id: item.id,
              title: item.title,
              start: item.start.slice(0, 10),
              allDay: true,
              backgroundColor: itemColor,
              borderColor: itemColor,
              textColor: '#ffffff',
              display: 'block',
              extendedProps: {
                rawItem: item,
                eventColor: itemColor,
              },
            };
          } else {
            const dueDate = new Date((item.raw as any)?.dueDate || item.start);
            const localHours = dueDate.getHours();
            let start: Date;
            let end: Date;

            // If due in the 11 PM hour (e.g. 11:59 PM), position from 23:00 to 23:30
            // This leaves 30 minutes of clearance before midnight so the surrounding box is never clipped by the bottom border
            if (localHours === 23) {
              start = new Date(dueDate);
              start.setHours(23, 0, 0, 0);
              end = new Date(dueDate);
              end.setHours(23, 30, 0, 0);
            } else {
              start = dueDate;
              end = new Date(dueDate.getTime() + 30 * 60 * 1000);
            }

            return {
              id: item.id,
              title: item.title,
              start: start.toISOString(),
              end: end.toISOString(),
              allDay: false,
              backgroundColor: itemColor,
              borderColor: itemColor,
              textColor: '#ffffff',
              display: 'block',
              extendedProps: {
                rawItem: item,
                eventColor: itemColor,
              },
            };
          }
        }

        return {
          id: item.id,
          title: item.title,
          start: item.start,
          end: item.end,
          allDay: item.allDay,
          backgroundColor: itemColor,
          borderColor: itemColor,
          textColor: '#ffffff',
          display: 'block',
          extendedProps: {
            rawItem: item,
            eventColor: itemColor,
          },
        };
      });
  }, [items, showTodos, showEvents, showTimeChunks]);

  // Handle clicking an event on calendar
  const handleEventClick = (clickInfo: any) => {
    const rawItem: UnifiedCalendarItem = clickInfo.event.extendedProps.rawItem;
    if (rawItem) {
      setSelectedItem(rawItem);
    }
  };

  // Handle drag selection or slot selection
  const handleSelect = (selectionInfo: any) => {
    // If not all-day, verify that the selection does not overlap existing items
    if (!selectionInfo.allDay) {
      const conflict = findConflictingItem(selectionInfo.start, selectionInfo.end, items);
      if (conflict) {
        selectionInfo.view.calendar.unselect();
        setOverlapAlert(
          `Cannot schedule: time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
        );
        return;
      }
    }

    setOverlapAlert(null);
    setSelectedRange({
      start: selectionInfo.start,
      end: selectionInfo.end,
      startStr: selectionInfo.startStr,
      endStr: selectionInfo.endStr,
      allDay: selectionInfo.allDay,
    });
    setClickedDate(selectionInfo.startStr);
    selectionInfo.view.calendar.unselect();
    setSlotChoiceModalOpen(true);
  };

  // Handle event drag and drop to new date/time
  const handleEventDrop = async (dropInfo: any) => {
    const rawItem: UnifiedCalendarItem = dropInfo.event.extendedProps.rawItem;
    if (!rawItem) return;

    try {
      const newStart = dropInfo.event.start;
      if (!newStart) return;

      const isAllDay = dropInfo.event.allDay;
      let newEnd = dropInfo.event.end;

      if (!newEnd) {
        if (rawItem.type === 'todo') {
          newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);
        } else if (rawItem.type === 'timeChunk') {
          newEnd = new Date(newStart.getTime() + 45 * 60 * 1000);
        } else {
          newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
        }
      }

      // Overlap validation for timed items
      if (!isAllDay) {
        const conflict = findConflictingItem(newStart, newEnd, items, rawItem.id);
        if (conflict) {
          dropInfo.revert();
          setOverlapAlert(
            `Cannot move item: time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
          );
          return;
        }
      }

      setOverlapAlert(null);

      if (rawItem.type === 'todo') {
        await onUpdateTodo(rawItem.originalId, {
          dueDate: newStart.toISOString(),
          allDay: isAllDay,
        });
      } else if (rawItem.type === 'event') {
        await onUpdateEvent(rawItem.originalId, {
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
          allDay: isAllDay,
        });
      } else if (rawItem.type === 'timeChunk') {
        await onUpdateTimeChunk(rawItem.originalId, {
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        });
      }
    } catch (err: any) {
      console.error('Failed to update event position:', err);
      dropInfo.revert();
      setOverlapAlert(err.message || 'Failed to move item');
    }
  };

  // Handle event resizing
  const handleEventResize = async (resizeInfo: any) => {
    const rawItem: UnifiedCalendarItem = resizeInfo.event.extendedProps.rawItem;
    if (!rawItem) return;

    try {
      const newStart = resizeInfo.event.start;
      const newEnd = resizeInfo.event.end;

      if (!newStart || !newEnd) return;

      if (!resizeInfo.event.allDay) {
        const conflict = findConflictingItem(newStart, newEnd, items, rawItem.id);
        if (conflict) {
          resizeInfo.revert();
          setOverlapAlert(
            `Cannot resize item: time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
          );
          return;
        }
      }

      setOverlapAlert(null);

      if (rawItem.type === 'event') {
        await onUpdateEvent(rawItem.originalId, {
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        });
      } else if (rawItem.type === 'timeChunk') {
        await onUpdateTimeChunk(rawItem.originalId, {
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        });
      }
    } catch (err: any) {
      console.error('Failed to update event duration:', err);
      resizeInfo.revert();
      setOverlapAlert(err.message || 'Failed to resize item');
    }
  };

  // Overlap-checked creation wrappers
  const handleCreateTodoWrapped = async (data: any) => {
    if (data.dueDate && !data.allDay) {
      const dueDate = new Date(data.dueDate);
      const start = dueDate;
      const end = new Date(dueDate.getTime() + 30 * 60 * 1000);
      const conflict = findConflictingItem(start, end, items);
      if (conflict) {
        throw new Error(
          `Cannot schedule task: due time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
        );
      }
    }
    await onCreateTodo(data);
  };

  const handleCreateEventWrapped = async (data: any) => {
    if (!data.allDay) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const conflict = findConflictingItem(start, end, items);
      if (conflict) {
        throw new Error(
          `Cannot schedule event: time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
        );
      }
    }
    await onCreateEvent(data);
  };

  const handleCreateTimeChunkWrapped = async (data: any) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const conflict = findConflictingItem(start, end, items);
    if (conflict) {
      throw new Error(
        `Cannot block time chunk: conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
      );
    }
    await onCreateTimeChunk(data);
  };

  // Overlap-checked update wrappers for UnifiedItemModal
  const handleUpdateTodoWrapped = async (id: string, data: Partial<Todo>) => {
    if (data.dueDate && !data.allDay) {
      const dueDate = new Date(data.dueDate);
      const start = dueDate;
      const end = new Date(dueDate.getTime() + 30 * 60 * 1000);
      const conflict = findConflictingItem(start, end, items, id);
      if (conflict) {
        throw new Error(
          `Cannot update task: due time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
        );
      }
    }
    await onUpdateTodo(id, data);
  };

  const handleUpdateEventWrapped = async (id: string, data: Partial<CalendarEvent>) => {
    if (data.startDate && data.endDate && !data.allDay) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const conflict = findConflictingItem(start, end, items, id);
      if (conflict) {
        throw new Error(
          `Cannot update event: time conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
        );
      }
    }
    await onUpdateEvent(id, data);
  };

  const handleUpdateTimeChunkWrapped = async (id: string, data: Partial<TimeChunk>) => {
    if (data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      const conflict = findConflictingItem(start, end, items, id);
      if (conflict) {
        throw new Error(
          `Cannot update time chunk: conflicts with "${conflict.cleanTitle}" (${conflict.formattedTime}). Overlapping items are not allowed.`
        );
      }
    }
    await onUpdateTimeChunk(id, data);
  };

  const renderEventContent = useCallback((eventInfo: any) => {
    const rawItem = eventInfo.event.extendedProps?.rawItem;
    const eventColor =
      eventInfo.event.backgroundColor ||
      eventInfo.event.extendedProps?.eventColor ||
      (rawItem?.type === 'todo' ? '#F59E0B' : rawItem?.type === 'event' ? '#3B82F6' : '#8B5CF6');
    const isAllDay = eventInfo.event.allDay;
    const title = eventInfo.event.title;
    const isTimeGrid = eventInfo.view.type.startsWith('timeGrid');

    // Extract exact due date if todo
    const todoDueDate =
      rawItem?.type === 'todo'
        ? ((rawItem.raw as any)?.dueDate || rawItem.start)
        : null;

    let timeDisplay = eventInfo.timeText;
    if (todoDueDate && !isAllDay) {
      const d = new Date(todoDueDate);
      timeDisplay = `Due ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    }

    // Todos: Show text on the left, checkbox on the right across all views (Month, Week, Day)
    if (rawItem?.type === 'todo') {
      const isCompleted = Boolean(rawItem.completed || (rawItem.raw as Todo)?.completed);
      const cleanTitle = (rawItem.raw as Todo)?.title || title.replace(/^[✓☐\s]+/, '');

      return (
        <div
          className="flex items-center justify-between h-full w-full rounded-md px-2 py-0.5 text-white leading-tight overflow-hidden shadow-xs cursor-pointer group"
          style={{ backgroundColor: eventColor }}
        >
          {/* Text on the left */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1.5">
            {timeDisplay && !isAllDay && (
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide shrink-0">
                {timeDisplay} •
              </span>
            )}
            <span
              className={`text-xs font-semibold truncate ${
                isCompleted ? 'line-through opacity-80' : ''
              }`}
              title={cleanTitle}
            >
              {cleanTitle}
            </span>
          </div>

          {/* Checkbox on the right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTodo(rawItem.originalId);
            }}
            className="shrink-0 p-0.5 hover:scale-125 transition-transform text-white/90 hover:text-white"
            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            {isCompleted ? (
              <CheckSquare size={14} className="text-white" />
            ) : (
              <Square size={14} className="text-white/80 hover:text-white" />
            )}
          </button>
        </div>
      );
    }

    // Events & Time Chunks in TimeGrid (Week & Day views)
    if (isTimeGrid) {
      return (
        <div
          className="flex flex-col justify-start h-full w-full rounded-md px-2 py-1 text-white leading-tight overflow-hidden shadow-xs"
          style={{ backgroundColor: eventColor }}
        >
          {timeDisplay && !isAllDay && (
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide leading-tight shrink-0">
              {timeDisplay}
            </span>
          )}
          <span className="text-xs font-semibold text-white mt-0.5 break-words line-clamp-2 leading-snug">
            {title}
          </span>
        </div>
      );
    }

    // Events & Time Chunks in Month view
    return (
      <div
        className="flex items-center gap-1.5 w-full rounded px-2 py-0.5 text-white leading-tight overflow-hidden shadow-xs"
        style={{ backgroundColor: eventColor }}
      >
        <span className="text-xs font-medium text-white truncate">
          {title}
        </span>
      </div>
    );
  }, [onToggleTodo]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Calendar Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1 hidden sm:inline">
            Display:
          </span>

          {/* Todo Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowTodos(!showTodos)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTodos
                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <CheckSquare size={14} className={showTodos ? 'text-amber-700' : 'text-slate-400'} />
            <span>Tasks</span>
            <span className="hidden sm:inline"> (Due Dates)</span>
          </button>

          {/* Event Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowEvents(!showEvents)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showEvents
                ? 'bg-blue-100 text-blue-900 ring-1 ring-blue-300'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <CalendarIcon size={14} className={showEvents ? 'text-blue-700' : 'text-slate-400'} />
            <span className="sm:hidden">Events</span>
            <span className="hidden sm:inline">Upcoming Events</span>
          </button>

          {/* Time Chunk Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowTimeChunks(!showTimeChunks)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTimeChunks
                ? 'bg-purple-100 text-purple-900 ring-1 ring-purple-300'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
            }`}
          >
            <Zap size={14} className={showTimeChunks ? 'text-purple-700' : 'text-slate-400'} />
            <span className="sm:hidden">Focus</span>
            <span className="hidden sm:inline">Time Chunks</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              const remainder = 15 - (now.getMinutes() % 15);
              const start = new Date(now.getTime() + remainder * 60 * 1000);
              const end = new Date(start.getTime() + 60 * 60 * 1000);
              setSelectedRange({
                start,
                end,
                startStr: start.toISOString(),
                endStr: end.toISOString(),
                allDay: false,
              });
              setClickedDate(start.toISOString());
              setSlotChoiceModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Quick Add
          </button>
        </div>
      </div>

      {/* Overlap Conflict Alert Banner */}
      {overlapAlert && (
        <div className="p-3.5 sm:p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-red-900">Schedule Conflict</div>
            <div className="text-xs mt-0.5 text-red-700 leading-relaxed">{overlapAlert}</div>
          </div>
          <button
            type="button"
            onClick={() => setOverlapAlert(null)}
            className="text-red-500 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main FullCalendar container */}
      <div className="bg-white p-2.5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs min-h-[500px]">
        <ErrorBoundary fallbackTitle="Calendar Component Error">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin] as any}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            editable={true}
            selectable={true}
            selectMirror={true}
            selectOverlap={false}
            eventOverlap={false}
            slotEventOverlap={false}
            selectAllow={(selectInfo) => {
              if (selectInfo.allDay) return true;
              return !findConflictingItem(selectInfo.start, selectInfo.end, items);
            }}
            dayMaxEvents={4}
            weekends={true}
            nextDayThreshold="09:00:00"
            timeZone="local"
            eventDisplay="block"
            defaultTimedEventDuration="00:30:00"
            events={calendarEvents}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            select={handleSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
          />
        </ErrorBoundary>
      </div>

      {/* Slot click choice modal */}
      <Modal
        isOpen={slotChoiceModalOpen}
        onClose={() => {
          setSlotChoiceModalOpen(false);
          setSelectedRange(null);
        }}
        title="Create New Item on Calendar"
      >
        <div className="space-y-3 py-2">
          {selectedRange ? (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-xl mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Selected Time Slot
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-200/60 rounded text-indigo-900">
                  {selectedRange.allDay
                    ? 'All Day'
                    : `${Math.round((selectedRange.end.getTime() - selectedRange.start.getTime()) / (60 * 1000))} min`}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-800 mt-1">
                {selectedRange.start.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
                {!selectedRange.allDay && (
                  <span className="text-slate-600 font-normal ml-1.5">
                    • {formatTimeRange(selectedRange.start, selectedRange.end)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">
              Selected Date/Time:{' '}
              <span className="font-semibold text-slate-700">
                {clickedDate ? new Date(clickedDate).toLocaleString() : ''}
              </span>
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setSlotChoiceModalOpen(false);
              setTodoModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckSquare size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Task with Due Date</div>
                {selectedRange && !selectedRange.allDay && (
                  <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    Due at {selectedRange.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Track an actionable item with priority and deadline</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSlotChoiceModalOpen(false);
              setEventModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Event / Meeting</div>
                {selectedRange && !selectedRange.allDay && (
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                    {formatTimeRange(selectedRange.start, selectedRange.end)}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Schedule meetings, deadlines, or upcoming plans</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSlotChoiceModalOpen(false);
              setTimeChunkModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Zap size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-800">Time Chunk (Focus Block)</div>
                {selectedRange && !selectedRange.allDay && (
                  <span className="text-[11px] font-medium text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                    {formatTimeRange(selectedRange.start, selectedRange.end)}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Block dedicated focus time for deep work or study</div>
            </div>
          </button>
        </div>
      </Modal>

      {/* Selected Item View/Edit Modal */}
      <UnifiedItemModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onUpdateTodo={handleUpdateTodoWrapped}
        onDeleteTodo={onDeleteTodo}
        onToggleTodo={onToggleTodo}
        onUpdateEvent={handleUpdateEventWrapped}
        onDeleteEvent={onDeleteEvent}
        onUpdateTimeChunk={handleUpdateTimeChunkWrapped}
        onDeleteTimeChunk={onDeleteTimeChunk}
        onToggleTimeChunk={onToggleTimeChunk}
      />

      {/* Creation modals from slot choice */}
      <TodoModal
        isOpen={todoModalOpen}
        onClose={() => {
          setTodoModalOpen(false);
          setSelectedRange(null);
        }}
        onSubmit={handleCreateTodoWrapped}
        defaultDueDate={selectedRange?.startStr || clickedDate}
      />

      <EventModal
        isOpen={eventModalOpen}
        onClose={() => {
          setEventModalOpen(false);
          setSelectedRange(null);
        }}
        onSubmit={handleCreateEventWrapped}
        defaultStartDate={selectedRange?.startStr || clickedDate}
        defaultEndDate={selectedRange?.endStr || null}
        defaultAllDay={selectedRange?.allDay}
      />

      <TimeChunkModal
        isOpen={timeChunkModalOpen}
        onClose={() => {
          setTimeChunkModalOpen(false);
          setSelectedRange(null);
        }}
        onSubmit={handleCreateTimeChunkWrapped}
        defaultStartTime={selectedRange?.startStr || clickedDate}
        defaultEndTime={selectedRange?.endStr || null}
      />
    </div>
  );
};
