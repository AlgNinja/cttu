import React, { useState } from 'react';
import {
  Zap,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Flame,
  Timer,
} from 'lucide-react';
import { TimeChunk } from '../../types';
import { TimeChunkModal } from './TimeChunkModal';

interface TimeChunkListProps {
  timeChunks: TimeChunk[];
  loading: boolean;
  onToggleTimeChunk: (id: string) => Promise<void>;
  onCreateTimeChunk: (data: {
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    category?: string;
    color?: string;
  }) => Promise<void>;
  onUpdateTimeChunk: (id: string, data: Partial<TimeChunk>) => Promise<void>;
  onDeleteTimeChunk: (id: string) => Promise<void>;
}

export const TimeChunkList: React.FC<TimeChunkListProps> = ({
  timeChunks,
  loading,
  onToggleTimeChunk,
  onCreateTimeChunk,
  onUpdateTimeChunk,
  onDeleteTimeChunk,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChunk, setEditingChunk] = useState<TimeChunk | null>(null);

  // Duration in minutes helper
  const getDurationMinutes = (startStr: string, endStr: string) => {
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    return Math.max(0, Math.round((e - s) / (1000 * 60)));
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainder = mins % 60;
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
  };

  // Filter chunks
  const filteredChunks = timeChunks.filter((chunk) => {
    if (categoryFilter !== 'ALL' && chunk.category !== categoryFilter) return false;
    return true;
  });

  // Calculate stats for today
  const today = new Date().toISOString().slice(0, 10);
  const todaysChunks = timeChunks.filter(
    (c) => c.startTime.slice(0, 10) === today
  );

  const totalMinutesToday = todaysChunks.reduce(
    (acc, c) => acc + getDurationMinutes(c.startTime, c.endTime),
    0
  );

  const completedMinutesToday = todaysChunks
    .filter((c) => c.completed)
    .reduce((acc, c) => acc + getDurationMinutes(c.startTime, c.endTime), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quick Summary / Header Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="p-3 sm:p-4 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0">
            <Zap size={18} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-purple-600 truncate">
              Scheduled Today
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-800">
              {formatDuration(totalMinutesToday)}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-xs shrink-0">
            <Flame size={18} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 truncate">
              Done Today
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-800">
              {formatDuration(completedMinutesToday)}
            </div>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-600">
              Active Time Blocks
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-800">
              {timeChunks.length} Total
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingChunk(null);
              setModalOpen(true);
            }}
            className="p-2 sm:p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            title="Block out new time chunk"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Controls & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          {['ALL', 'FOCUS', 'WORK', 'STUDY', 'MEETING', 'BREAK', 'EXERCISE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Blocks' : cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingChunk(null);
            setModalOpen(true);
          }}
          className="w-full sm:w-auto justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          Block Time Chunk
        </button>
      </div>

      {/* Time Chunks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredChunks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
            <Timer size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No time chunks created</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Time chunking helps you protect focused blocks of time for deep work, study, or meetings.
          </p>
          <button
            onClick={() => {
              setEditingChunk(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={16} />
            Block Out Time
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChunks.map((chunk) => {
            const start = new Date(chunk.startTime);
            const end = new Date(chunk.endTime);
            const durationMins = getDurationMinutes(chunk.startTime, chunk.endTime);

            return (
              <div
                key={chunk.id}
                className={`group flex items-start justify-between gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border transition-all hover:shadow-xs ${
                  chunk.completed
                    ? 'border-slate-100 bg-slate-50/40 opacity-75'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleTimeChunk(chunk.id)}
                    className="mt-0.5 text-slate-400 hover:text-purple-600 transition-colors shrink-0 p-0.5"
                    title={chunk.completed ? 'Mark incomplete' : 'Mark chunk completed'}
                  >
                    {chunk.completed ? (
                      <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>

                  <div
                    className="w-1 self-stretch rounded-full shrink-0"
                    style={{ backgroundColor: chunk.color || '#8B5CF6' }}
                  />

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          chunk.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-800'
                        }`}
                      >
                        {chunk.title}
                      </span>
                      <span
                        className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider rounded-md text-white"
                        style={{ backgroundColor: chunk.color || '#8B5CF6' }}
                      >
                        {chunk.category}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md">
                        {formatDuration(durationMins)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {start.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {' • '}
                        {start.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {end.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {chunk.description && (
                      <p className="text-xs text-slate-500 pt-0.5 line-clamp-2">
                        {chunk.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditingChunk(chunk);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit time chunk"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteTimeChunk(chunk.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete time chunk"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Time Chunk Modal */}
      <TimeChunkModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingChunk(null);
        }}
        onSubmit={async (data) => {
          if (editingChunk) {
            await onUpdateTimeChunk(editingChunk.id, data);
          } else {
            await onCreateTimeChunk(data);
          }
        }}
        initialData={editingChunk}
      />
    </div>
  );
};
