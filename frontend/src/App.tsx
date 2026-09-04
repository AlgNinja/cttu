import { useState, useEffect, useCallback } from 'react';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { Navbar, TabType } from './components/Navbar';
import { SetupBanner, WelcomeHero } from './components/Common/SetupBanner';
import { CalendarView } from './components/Calendar/CalendarView';
import { TodoList } from './components/Todos/TodoList';
import { EventList } from './components/Events/EventList';
import { TimeChunkList } from './components/TimeChunking/TimeChunkList';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { useApi } from './services/api';
import {
  Todo,
  CalendarEvent,
  TimeChunk,
  UnifiedCalendarItem,
  Priority,
} from './types';
import { AlertCircle } from 'lucide-react';

export function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [currentTab, setCurrentTab] = useState<TabType>('calendar');

  const [todos, setTodos] = useState<Todo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeChunks, setTimeChunks] = useState<TimeChunk[]>([]);
  const [calendarItems, setCalendarItems] = useState<UnifiedCalendarItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch all user data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);

      const calendarRes = await api.getCalendar();
      setCalendarItems(calendarRes.items || []);
      setTodos(calendarRes.todos || []);
      setEvents(calendarRes.events || []);
      setTimeChunks(calendarRes.timeChunks || []);
    } catch (err: any) {
      console.warn('Could not fetch data from backend:', err);
      setApiError(err.message || 'Failed to connect to backend API');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, fetchData]);

  // --- TODO HANDLERS ---
  const handleCreateTodo = async (data: {
    title: string;
    description?: string | null;
    dueDate?: string | null;
    priority: Priority;
  }) => {
    await api.createTodo(data);
    await fetchData();
  };

  const handleUpdateTodo = async (id: string, data: Partial<Todo>) => {
    await api.updateTodo(id, data);
    await fetchData();
  };

  const handleToggleTodo = async (id: string) => {
    await api.toggleTodo(id);
    await fetchData();
  };

  const handleDeleteTodo = async (id: string) => {
    await api.deleteTodo(id);
    await fetchData();
  };

  // --- EVENT HANDLERS ---
  const handleCreateEvent = async (data: {
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    allDay?: boolean;
    location?: string | null;
    color?: string;
  }) => {
    await api.createEvent(data);
    await fetchData();
  };

  const handleUpdateEvent = async (id: string, data: Partial<CalendarEvent>) => {
    await api.updateEvent(id, data);
    await fetchData();
  };

  const handleDeleteEvent = async (id: string) => {
    await api.deleteEvent(id);
    await fetchData();
  };

  // --- TIME CHUNK HANDLERS ---
  const handleCreateTimeChunk = async (data: {
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    category?: string;
    color?: string;
  }) => {
    await api.createTimeChunk(data);
    await fetchData();
  };

  const handleUpdateTimeChunk = async (id: string, data: Partial<TimeChunk>) => {
    await api.updateTimeChunk(id, data);
    await fetchData();
  };

  const handleToggleTimeChunk = async (id: string) => {
    await api.toggleTimeChunk(id);
    await fetchData();
  };

  const handleDeleteTimeChunk = async (id: string) => {
    await api.deleteTimeChunk(id);
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <SetupBanner />
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        counts={{
          todos: todos.filter((t) => !t.completed).length,
          events: events.length,
          timeChunks: timeChunks.length,
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <SignedOut>
          <WelcomeHero />
        </SignedOut>

        <SignedIn>
          <ErrorBoundary fallbackTitle="Dashboard Error">
            {apiError && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Backend Connection Notice</div>
                  <div className="text-xs mt-0.5">
                    {apiError}. Make sure your database and backend server are running.
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'calendar' && (
              <CalendarView
                items={calendarItems}
                loading={loading}
                onUpdateTodo={handleUpdateTodo}
                onDeleteTodo={handleDeleteTodo}
                onToggleTodo={handleToggleTodo}
                onCreateTodo={handleCreateTodo}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onCreateEvent={handleCreateEvent}
                onUpdateTimeChunk={handleUpdateTimeChunk}
                onDeleteTimeChunk={handleDeleteTimeChunk}
                onToggleTimeChunk={handleToggleTimeChunk}
                onCreateTimeChunk={handleCreateTimeChunk}
              />
            )}

            {currentTab === 'todos' && (
              <TodoList
                todos={todos}
                loading={loading}
                onToggleTodo={handleToggleTodo}
                onCreateTodo={handleCreateTodo}
                onUpdateTodo={handleUpdateTodo}
                onDeleteTodo={handleDeleteTodo}
              />
            )}

            {currentTab === 'events' && (
              <EventList
                events={events}
                loading={loading}
                onCreateEvent={handleCreateEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            )}

            {currentTab === 'timeChunks' && (
              <TimeChunkList
                timeChunks={timeChunks}
                loading={loading}
                onToggleTimeChunk={handleToggleTimeChunk}
                onCreateTimeChunk={handleCreateTimeChunk}
                onUpdateTimeChunk={handleUpdateTimeChunk}
                onDeleteTimeChunk={handleDeleteTimeChunk}
              />
            )}
          </ErrorBoundary>
        </SignedIn>
      </main>
    </div>
  );
}

export default App;
