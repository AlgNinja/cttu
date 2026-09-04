import React, { useState, useMemo, useCallback } from 'react';
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
import { CheckSquare, Square, Calendar as CalendarIcon, Zap, Plus } from 'lucide-react';

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

  // Slot click create choice modal
  const [slotChoiceModalOpen, setSlotChoiceModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | null>(null);

  // Specific creation modals
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [timeChunkModalOpen, setTimeChunkModalOpen] = useState(false);

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

  // Handle clicking an empty slot
  const handleDateClick = (arg: any) => {
    setClickedDate(arg.dateStr);
    setSlotChoiceModalOpen(true);
  };

  // Handle event drag and drop to new date/time
  const handleEventDrop = async (dropInfo: any) => {
    const rawItem: UnifiedCalendarItem = dropInfo.event.extendedProps.rawItem;
    if (!rawItem) return;

    try {
      const newStart = dropInfo.event.start;
      const newEnd = dropInfo.event.end || newStart;

      if (!newStart) return;

      if (rawItem.type === 'todo') {
        await onUpdateTodo(rawItem.originalId, {
          dueDate: newStart.toISOString(),
          allDay: dropInfo.event.allDay,
        });
      } else if (rawItem.type === 'event') {
        await onUpdateEvent(rawItem.originalId, {
          startDate: newStart.toISOString(),
          endDate: newEnd ? newEnd.toISOString() : newStart.toISOString(),
          allDay: dropInfo.event.allDay,
        });
      } else if (rawItem.type === 'timeChunk') {
        await onUpdateTimeChunk(rawItem.originalId, {
          startTime: newStart.toISOString(),
          endTime: newEnd ? newEnd.toISOString() : new Date(newStart.getTime() + 45 * 60 * 1000).toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to update event position:', err);
      dropInfo.revert();
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
    } catch (err) {
      console.error('Failed to update event duration:', err);
      resizeInfo.revert();
    }
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
          <span
            className={`text-xs font-semibold truncate flex-1 mr-1.5 ${
              isCompleted ? 'line-through opacity-80' : ''
            }`}
            title={cleanTitle}
          >
            {cleanTitle}
          </span>

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
              setClickedDate(new Date().toISOString());
              setSlotChoiceModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Quick Add
          </button>
        </div>
      </div>

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
            dayMaxEvents={4}
            weekends={true}
            nextDayThreshold="09:00:00"
            timeZone="local"
            eventDisplay="block"
            eventMinHeight={36}
            defaultTimedEventDuration="00:30:00"
            events={calendarEvents}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
          />
        </ErrorBoundary>
      </div>

      {/* Slot click choice modal */}
      <Modal
        isOpen={slotChoiceModalOpen}
        onClose={() => setSlotChoiceModalOpen(false)}
        title="Create New Item on Calendar"
      >
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-500 mb-4">
            Selected Date/Time: <span className="font-semibold text-slate-700">{clickedDate ? new Date(clickedDate).toLocaleString() : ''}</span>
          </p>

          <button
            type="button"
            onClick={() => {
              setSlotChoiceModalOpen(false);
              setTodoModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CheckSquare size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Task with Due Date</div>
              <div className="text-xs text-slate-500">Track an actionable item with priority and due date</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSlotChoiceModalOpen(false);
              setEventModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Event / Meeting</div>
              <div className="text-xs text-slate-500">Schedule meetings, deadlines, or upcoming plans</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSlotChoiceModalOpen(false);
              setTimeChunkModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Time Chunk (Focus Block)</div>
              <div className="text-xs text-slate-500">Block dedicated focus time for deep work or study</div>
            </div>
          </button>
        </div>
      </Modal>

      {/* Selected Item View/Edit Modal */}
      <UnifiedItemModal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        item={selectedItem}
        onUpdateTodo={onUpdateTodo}
        onDeleteTodo={onDeleteTodo}
        onToggleTodo={onToggleTodo}
        onUpdateEvent={onUpdateEvent}
        onDeleteEvent={onDeleteEvent}
        onUpdateTimeChunk={onUpdateTimeChunk}
        onDeleteTimeChunk={onDeleteTimeChunk}
        onToggleTimeChunk={onToggleTimeChunk}
      />

      {/* Creation modals from slot choice */}
      <TodoModal
        isOpen={todoModalOpen}
        onClose={() => setTodoModalOpen(false)}
        onSubmit={onCreateTodo}
        defaultDueDate={clickedDate}
      />

      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={onCreateEvent}
        defaultStartDate={clickedDate}
      />

      <TimeChunkModal
        isOpen={timeChunkModalOpen}
        onClose={() => setTimeChunkModalOpen(false)}
        onSubmit={onCreateTimeChunk}
        defaultStartTime={clickedDate}
      />
    </div>
  );
};
