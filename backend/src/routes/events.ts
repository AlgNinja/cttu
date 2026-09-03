import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest, requireClerkAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireClerkAuth);

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allDay: z.boolean().optional().default(false),
  location: z.string().optional().nullable(),
  color: z.string().optional().default('#3B82F6'),
});

// GET /api/events
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { upcoming, start, end } = req.query;

    const where: any = { clerkUserId };

    if (upcoming === 'true') {
      where.endDate = { gte: new Date() };
    } else if (start || end) {
      where.AND = [];
      if (start && typeof start === 'string') {
        where.AND.push({ endDate: { gte: new Date(start) } });
      }
      if (end && typeof end === 'string') {
        where.AND.push({ startDate: { lte: new Date(end) } });
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    res.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// POST /api/events
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const parsed = eventSchema.parse(req.body);

    const startDate = new Date(parsed.startDate);
    const endDate = new Date(parsed.endDate);

    if (endDate < startDate) {
      res.status(400).json({ error: 'End date cannot be earlier than start date' });
      return;
    }

    const event = await prisma.event.create({
      data: {
        clerkUserId,
        title: parsed.title,
        description: parsed.description ?? null,
        startDate,
        endDate,
        allDay: parsed.allDay ?? false,
        location: parsed.location ?? null,
        color: parsed.color || '#3B82F6',
      },
    });

    res.status(201).json(event);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

// PUT /api/events/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;
    const parsed = eventSchema.partial().parse(req.body);

    const existing = await prisma.event.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Event not found or unauthorized' });
      return;
    }

    const startDate = parsed.startDate ? new Date(parsed.startDate) : existing.startDate;
    const endDate = parsed.endDate ? new Date(parsed.endDate) : existing.endDate;

    if (endDate < startDate) {
      res.status(400).json({ error: 'End date cannot be earlier than start date' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.startDate !== undefined ? { startDate } : {}),
        ...(parsed.endDate !== undefined ? { endDate } : {}),
        ...(parsed.allDay !== undefined ? { allDay: parsed.allDay } : {}),
        ...(parsed.location !== undefined ? { location: parsed.location } : {}),
        ...(parsed.color !== undefined ? { color: parsed.color } : {}),
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;

    const existing = await prisma.event.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Event not found or unauthorized' });
      return;
    }

    await prisma.event.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

export default router;
