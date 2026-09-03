import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest, requireClerkAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireClerkAuth);

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  allDay: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  completed: z.boolean().optional().default(false),
});

// GET /api/todos
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { completed, priority } = req.query;

    const where: any = { clerkUserId };
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    if (priority && typeof priority === 'string') {
      where.priority = priority.toUpperCase();
    }

    const todos = await prisma.todo.findMany({
      where,
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(todos);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
  }
});

// POST /api/todos
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const parsed = todoSchema.parse(req.body);

    let allDay = parsed.allDay;
    let dueDate: Date | null = null;
    if (parsed.dueDate) {
      dueDate = new Date(parsed.dueDate);
      if (allDay === undefined) {
        allDay = parsed.dueDate.length <= 10;
      }
    } else {
      allDay = allDay ?? false;
    }

    const todo = await prisma.todo.create({
      data: {
        clerkUserId,
        title: parsed.title,
        description: parsed.description ?? null,
        dueDate,
        allDay: Boolean(allDay),
        priority: parsed.priority,
        completed: parsed.completed ?? false,
      },
    });

    res.status(201).json(todo);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo', details: error.message });
  }
});

// PUT /api/todos/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;
    const parsed = todoSchema.partial().parse(req.body);

    const existing = await prisma.todo.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Todo not found or unauthorized' });
      return;
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.dueDate !== undefined ? { dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null } : {}),
        ...(parsed.allDay !== undefined ? { allDay: parsed.allDay } : {}),
        ...(parsed.priority !== undefined ? { priority: parsed.priority } : {}),
        ...(parsed.completed !== undefined ? { completed: parsed.completed } : {}),
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo', details: error.message });
  }
});

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;

    const existing = await prisma.todo.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Todo not found or unauthorized' });
      return;
    }

    const updated = await prisma.todo.update({
      where: { id },
      data: {
        completed: !existing.completed,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error toggling todo:', error);
    res.status(500).json({ error: 'Failed to toggle todo status', details: error.message });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;

    const existing = await prisma.todo.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Todo not found or unauthorized' });
      return;
    }

    await prisma.todo.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo', details: error.message });
  }
});

export default router;
