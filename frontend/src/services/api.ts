import { useAuth } from '@clerk/clerk-react';
import { useMemo, useRef } from 'react';
import { Todo, CalendarEvent, TimeChunk, UnifiedCalendarItem } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface CalendarResponse {
  items: UnifiedCalendarItem[];
  counts: {
    todos: number;
    events: number;
    timeChunks: number;
    total: number;
  };
  todos: Todo[];
  events: CalendarEvent[];
  timeChunks: TimeChunk[];
}

export function createApiClient(getToken: () => Promise<string | null>) {
  async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  return {
    // Todos
    getTodos: async (params?: { completed?: boolean; priority?: string }): Promise<Todo[]> => {
      const searchParams = new URLSearchParams();
      if (params?.completed !== undefined) searchParams.set('completed', String(params.completed));
      if (params?.priority) searchParams.set('priority', params.priority);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<Todo[]>(`/todos${query}`);
    },
    createTodo: async (data: {
      title: string;
      description?: string | null;
      dueDate?: string | null;
      allDay?: boolean;
      priority?: string;
    }): Promise<Todo> => {
      return request<Todo>('/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTodo: async (id: string, data: Partial<Todo>): Promise<Todo> => {
      return request<Todo>(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    toggleTodo: async (id: string): Promise<Todo> => {
      return request<Todo>(`/todos/${id}/toggle`, {
        method: 'PATCH',
      });
    },
    deleteTodo: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/todos/${id}`, {
        method: 'DELETE',
      });
    },

    // Events
    getEvents: async (params?: { upcoming?: boolean; start?: string; end?: string }): Promise<CalendarEvent[]> => {
      const searchParams = new URLSearchParams();
      if (params?.upcoming) searchParams.set('upcoming', 'true');
      if (params?.start) searchParams.set('start', params.start);
      if (params?.end) searchParams.set('end', params.end);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<CalendarEvent[]>(`/events${query}`);
    },
    createEvent: async (data: {
      title: string;
      description?: string | null;
      startDate: string;
      endDate: string;
      allDay?: boolean;
      location?: string | null;
      color?: string;
    }): Promise<CalendarEvent> => {
      return request<CalendarEvent>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateEvent: async (id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
      return request<CalendarEvent>(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteEvent: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/events/${id}`, {
        method: 'DELETE',
      });
    },

    // Time Chunks
    getTimeChunks: async (params?: { category?: string; start?: string; end?: string }): Promise<TimeChunk[]> => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.set('category', params.category);
      if (params?.start) searchParams.set('start', params.start);
      if (params?.end) searchParams.set('end', params.end);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<TimeChunk[]>(`/time-chunks${query}`);
    },
    createTimeChunk: async (data: {
      title: string;
      description?: string | null;
      startTime: string;
      endTime: string;
      category?: string;
      color?: string;
    }): Promise<TimeChunk> => {
      return request<TimeChunk>('/time-chunks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateTimeChunk: async (id: string, data: Partial<TimeChunk>): Promise<TimeChunk> => {
      return request<TimeChunk>(`/time-chunks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    toggleTimeChunk: async (id: string): Promise<TimeChunk> => {
      return request<TimeChunk>(`/time-chunks/${id}/toggle`, {
        method: 'PATCH',
      });
    },
    deleteTimeChunk: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/time-chunks/${id}`, {
        method: 'DELETE',
      });
    },

    // Calendar
    getCalendar: async (params?: { start?: string; end?: string }): Promise<CalendarResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.start) searchParams.set('start', params.start);
      if (params?.end) searchParams.set('end', params.end);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return request<CalendarResponse>(`/calendar${query}`);
    },
  };
}

export function useApi() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useMemo(() => {
    return createApiClient(() => getTokenRef.current());
  }, []);
}
