import { Router, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest, requireClerkAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireClerkAuth);

export interface CalendarEventDTO {
  id: string;
  originalId: string;
  type: 'todo' | 'event' | 'timeChunk';
  title: string;
  description: string | null;
  start: string;
  end: string;
  allDay: boolean;
  color: string;
  completed?: boolean;
  priority?: string;
  category?: string;
  location?: string | null;
  raw: any;
}

// GET /api/calendar
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { start, end } = req.query;

    const startDate = start ? new Date(start as string) : undefined;
    const endDate = end ? new Date(end as string) : undefined;

    // Fetch todos with due dates
    const todoWhere: any = {
      clerkUserId,
      dueDate: { not: null },
    };
    if (startDate || endDate) {
      todoWhere.dueDate = {};
      if (startDate) todoWhere.dueDate.gte = startDate;
      if (endDate) todoWhere.dueDate.lte = endDate;
    }

    // Fetch events
    const eventWhere: any = { clerkUserId };
    if (startDate || endDate) {
      eventWhere.AND = [];
      if (startDate) eventWhere.AND.push({ endDate: { gte: startDate } });
      if (endDate) eventWhere.AND.push({ startDate: { lte: endDate } });
    }

    // Fetch time chunks
    const chunkWhere: any = { clerkUserId };
    if (startDate || endDate) {
      chunkWhere.AND = [];
      if (startDate) chunkWhere.AND.push({ endTime: { gte: startDate } });
      if (endDate) chunkWhere.AND.push({ startTime: { lte: endDate } });
    }

    const [todos, events, timeChunks] = await Promise.all([
      prisma.todo.findMany({ where: todoWhere, orderBy: { dueDate: 'asc' } }),
      prisma.event.findMany({ where: eventWhere, orderBy: { startDate: 'asc' } }),
      prisma.timeChunk.findMany({ where: chunkWhere, orderBy: { startTime: 'asc' } }),
    ]);

    const unifiedItems: CalendarEventDTO[] = [];

    // Map Todos to calendar format
    for (const todo of todos) {
      if (!todo.dueDate) continue;
      const due = new Date(todo.dueDate);
      const isPriorityHigh = todo.priority === 'HIGH';
      const color = todo.completed
        ? '#10B981' // Green when done
        : isPriorityHigh
        ? '#EF4444' // Red if high priority
        : '#F59E0B'; // Amber default for todos

      const isAllDay = Boolean(todo.allDay);
      // For all-day tasks, use YYYY-MM-DD so FullCalendar treats it as an exact calendar day
      // For timed tasks, start is ISO and end is 1 second later so end > start (preventing FullCalendar from applying default 1-hour duration across midnight)
      const startStr = isAllDay
        ? due.toISOString().slice(0, 10)
        : due.toISOString();
      const endStr = isAllDay
        ? startStr
        : new Date(due.getTime() + 1000).toISOString();

      unifiedItems.push({
        id: `todo_${todo.id}`,
        originalId: todo.id,
        type: 'todo',
        title: `${todo.completed ? '✓ ' : '☐ '} ${todo.title}`,
        description: todo.description,
        start: startStr,
        end: endStr,
        allDay: isAllDay,
        color,
        completed: todo.completed,
        priority: todo.priority,
        raw: todo,
      });
    }

    // Map Events to calendar format
    for (const evt of events) {
      unifiedItems.push({
        id: `event_${evt.id}`,
        originalId: evt.id,
        type: 'event',
        title: evt.title,
        description: evt.description,
        start: evt.startDate.toISOString(),
        end: evt.endDate.toISOString(),
        allDay: evt.allDay,
        color: evt.color || '#3B82F6', // Blue default
        location: evt.location,
        raw: evt,
      });
    }

    // Map TimeChunks to calendar format
    for (const chunk of timeChunks) {
      unifiedItems.push({
        id: `timeChunk_${chunk.id}`,
        originalId: chunk.id,
        type: 'timeChunk',
        title: `⚡ [${chunk.category}] ${chunk.title}`,
        description: chunk.description,
        start: chunk.startTime.toISOString(),
        end: chunk.endTime.toISOString(),
        allDay: false,
        color: chunk.color || '#8B5CF6', // Purple default
        completed: chunk.completed,
        category: chunk.category,
        raw: chunk,
      });
    }

    res.json({
      items: unifiedItems,
      counts: {
        todos: todos.length,
        events: events.length,
        timeChunks: timeChunks.length,
        total: unifiedItems.length,
      },
      todos,
      events,
      timeChunks,
    });
  } catch (error: any) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Failed to fetch calendar data', details: error.message });
  }
});

export default router;
