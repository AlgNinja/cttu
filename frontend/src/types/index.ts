export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TimeChunkCategory =
  | 'FOCUS'
  | 'WORK'
  | 'STUDY'
  | 'MEETING'
  | 'BREAK'
  | 'EXERCISE'
  | 'OTHER';

export interface Todo {
  id: string;
  clerkUserId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  allDay: boolean;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  clerkUserId: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeChunk {
  id: string;
  clerkUserId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  category: TimeChunkCategory | string;
  color: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UnifiedItemType = 'todo' | 'event' | 'timeChunk';

export interface UnifiedCalendarItem {
  id: string;
  originalId: string;
  type: UnifiedItemType;
  title: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  completed?: boolean;
  priority?: Priority;
  category?: string;
  location?: string | null;
  raw: Todo | CalendarEvent | TimeChunk;
}
