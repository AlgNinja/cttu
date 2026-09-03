import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest, requireClerkAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireClerkAuth);

const timeChunkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  category: z.string().optional().default('FOCUS'),
  color: z.string().optional().default('#8B5CF6'),
  completed: z.boolean().optional().default(false),
});

// GET /api/time-chunks
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { start, end, category } = req.query;

    const where: any = { clerkUserId };

    if (category && typeof category === 'string') {
      where.category = category.toUpperCase();
    }

    if (start || end) {
      where.AND = [];
      if (start && typeof start === 'string') {
        where.AND.push({ endTime: { gte: new Date(start) } });
      }
      if (end && typeof end === 'string') {
        where.AND.push({ startTime: { lte: new Date(end) } });
      }
    }

    const chunks = await prisma.timeChunk.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    res.json(chunks);
  } catch (error: any) {
    console.error('Error fetching time chunks:', error);
    res.status(500).json({ error: 'Failed to fetch time chunks', details: error.message });
  }
});

// POST /api/time-chunks
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const parsed = timeChunkSchema.parse(req.body);

    const startTime = new Date(parsed.startTime);
    const endTime = new Date(parsed.endTime);

    if (endTime <= startTime) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    const chunk = await prisma.timeChunk.create({
      data: {
        clerkUserId,
        title: parsed.title,
        description: parsed.description ?? null,
        startTime,
        endTime,
        category: (parsed.category || 'FOCUS').toUpperCase(),
        color: parsed.color || '#8B5CF6',
        completed: parsed.completed ?? false,
      },
    });

    res.status(201).json(chunk);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating time chunk:', error);
    res.status(500).json({ error: 'Failed to create time chunk', details: error.message });
  }
});

// PUT /api/time-chunks/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;
    const parsed = timeChunkSchema.partial().parse(req.body);

    const existing = await prisma.timeChunk.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Time chunk not found or unauthorized' });
      return;
    }

    const startTime = parsed.startTime ? new Date(parsed.startTime) : existing.startTime;
    const endTime = parsed.endTime ? new Date(parsed.endTime) : existing.endTime;

    if (endTime <= startTime) {
      res.status(400).json({ error: 'End time must be after start time' });
      return;
    }

    const updated = await prisma.timeChunk.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {}),
        ...(parsed.startTime !== undefined ? { startTime } : {}),
        ...(parsed.endTime !== undefined ? { endTime } : {}),
        ...(parsed.category !== undefined ? { category: parsed.category.toUpperCase() } : {}),
        ...(parsed.color !== undefined ? { color: parsed.color } : {}),
        ...(parsed.completed !== undefined ? { completed: parsed.completed } : {}),
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error updating time chunk:', error);
    res.status(500).json({ error: 'Failed to update time chunk', details: error.message });
  }
});

// PATCH /api/time-chunks/:id/toggle
router.patch('/:id/toggle', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;

    const existing = await prisma.timeChunk.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Time chunk not found or unauthorized' });
      return;
    }

    const updated = await prisma.timeChunk.update({
      where: { id },
      data: {
        completed: !existing.completed,
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error toggling time chunk status:', error);
    res.status(500).json({ error: 'Failed to toggle status', details: error.message });
  }
});

// DELETE /api/time-chunks/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { id } = req.params;

    const existing = await prisma.timeChunk.findFirst({
      where: { id, clerkUserId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Time chunk not found or unauthorized' });
      return;
    }

    await prisma.timeChunk.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Time chunk deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting time chunk:', error);
    res.status(500).json({ error: 'Failed to delete time chunk', details: error.message });
  }
});

export default router;
