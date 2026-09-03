import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CalendarCheck2,
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { EventModal } from './EventModal';

interface EventListProps {
  events: CalendarEvent[];
  loading: boolean;
  onCreateEvent: (data: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    location?: string | null;
    color?: string;
  }) => Promise<void>;
  onUpdateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  loading,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [tab, setTab] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const now = new Date();

  const filteredEvents = events.filter((evt) => {
    const end = new Date(evt.endDate);
    if (tab === 'upcoming') return end >= now;
    if (tab === 'past') return end < now;
    return true;
  });

  const formatEventTime = (startStr: string, endStr: string, allDay: boolean) => {
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (allDay) {
      return (
        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
          All Day • {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      );
    }

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) {
      return (
        <span className="text-xs text-slate-600 font-medium">
          {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},{' '}
          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      );
    }

    return (
      <span className="text-xs text-slate-600 font-medium">
        {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},{' '}
        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
        {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })},{' '}
        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with New Event Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setTab('upcoming')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'upcoming'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setTab('past')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              tab === 'past'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past Events
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingEvent(null);
            setModalOpen(true);
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Plus size={16} />
          Schedule Event
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck2 size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No events scheduled</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {tab === 'past'
              ? 'No past events found in your calendar history.'
              : 'Add your upcoming meetings, deadlines, and events to organize your days.'}
          </p>
          {tab !== 'past' && (
            <button
              onClick={() => {
                setEditingEvent(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={16} />
              Add First Event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const start = new Date(evt.startDate);
            const isToday =
              start.getDate() === now.getDate() &&
              start.getMonth() === now.getMonth() &&
              start.getFullYear() === now.getFullYear();

            return (
              <div
                key={evt.id}
                className="group flex items-start justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all hover:shadow-xs"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Left color bar / date icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: evt.color || '#3B82F6' }}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-tight">
                      {start.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-sm font-black leading-none">
                      {start.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {evt.title}
                      </span>
                      {isToday && (
                        <span className="px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        {formatEventTime(evt.startDate, evt.endDate, evt.allDay)}
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin size={13} className="text-slate-400" />
                          <span className="truncate max-w-xs">{evt.location}</span>
                        </div>
                      )}
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-500 pt-1 line-clamp-2">
                        {evt.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingEvent(evt);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit event"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteEvent(evt.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete event"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Modal */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={async (data) => {
          if (editingEvent) {
            await onUpdateEvent(editingEvent.id, data);
          } else {
            await onCreateEvent(data);
          }
        }}
        initialData={editingEvent}
      />
    </div>
  );
};
