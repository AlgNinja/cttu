import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Todo, Priority } from '../../types';
import { TodoModal } from './TodoModal';

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onToggleTodo: (id: string) => Promise<void>;
  onCreateTodo: (data: {
    title: string;
    description?: string | null;
    dueDate?: string | null;
    allDay?: boolean;
    priority: Priority;
  }) => Promise<void>;
  onUpdateTodo: (id: string, data: Partial<Todo>) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  loading,
  onToggleTodo,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [quickTitle, setQuickTitle] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await onCreateTodo({
      title: quickTitle.trim(),
      priority: 'MEDIUM',
    });
    setQuickTitle('');
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'pending' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (priorityFilter !== 'ALL' && todo.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full">
            Low
          </span>
        );
    }
  };

  const formatDueDate = (dateStr: string | null, completed: boolean, allDay?: boolean) => {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    const now = new Date();
    const isOverdue = !completed && due < now;
    const isToday =
      due.getDate() === now.getDate() &&
      due.getMonth() === now.getMonth() &&
      due.getFullYear() === now.getFullYear();

    const formattedDate = allDay
      ? `${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (All Day)`
      : due.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    return (
      <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
          completed
            ? 'text-slate-400'
            : isOverdue
            ? 'text-red-600'
            : isToday
            ? 'text-amber-600'
            : 'text-slate-500'
        }`}
      >
        {isOverdue ? (
          <AlertCircle size={13} className="shrink-0" />
        ) : (
          <CalendarIcon size={13} className="shrink-0" />
        )}
        <span>
          {isOverdue ? 'Overdue: ' : isToday ? 'Due today: ' : 'Due: '}
          {formattedDate}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white rounded-xl shadow-xs border border-slate-200"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a task... (press Enter)"
          className="flex-1 min-w-0 px-2.5 sm:px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setEditingTodo(null);
            setModalOpen(true);
          }}
          className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition-colors shrink-0 cursor-pointer"
        >
          Detailed
        </button>
      </form>

      {/* Filters and Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({todos.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all text-center ${
              filter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Done ({todos.filter((t) => t.completed).length})
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <label className="text-xs text-slate-500 font-medium">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Todo List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Clock size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No tasks found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {filter === 'completed'
              ? 'No completed tasks yet. Finish a task to see it here!'
              : 'Add your first task above with a due date to keep track on your calendar.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-start justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border transition-all hover:shadow-xs ${
                todo.completed
                  ? 'border-slate-100 bg-slate-50/40 opacity-75'
                  : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTodo(todo.id)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors shrink-0 p-0.5"
                >
                  {todo.completed ? (
                    <CheckCircle2 size={20} className="text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span
                      className={`text-sm font-medium ${
                        todo.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {todo.title}
                    </span>
                    {getPriorityBadge(todo.priority)}
                  </div>

                  {todo.description && (
                    <p
                      className={`text-xs ${
                        todo.completed ? 'text-slate-400' : 'text-slate-500'
                      } line-clamp-2`}
                    >
                      {todo.description}
                    </p>
                  )}

                  {todo.dueDate && (
                    <div className="pt-0.5">
                      {formatDueDate(todo.dueDate, todo.completed, todo.allDay)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => {
                    setEditingTodo(todo);
                    setModalOpen(true);
                  }}
                  className="p-1.5 sm:p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit task"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => onDeleteTodo(todo.id)}
                  className="p-1.5 sm:p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TodoModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTodo(null);
        }}
        onSubmit={async (data) => {
          if (editingTodo) {
            await onUpdateTodo(editingTodo.id, data);
          } else {
            await onCreateTodo(data);
          }
        }}
        initialData={editingTodo}
      />
    </div>
  );
};
