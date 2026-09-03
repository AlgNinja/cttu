"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.requireClerkAuth);
const timeChunkSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255),
    description: zod_1.z.string().optional().nullable(),
    startTime: zod_1.z.string().datetime(),
    endTime: zod_1.z.string().datetime(),
    category: zod_1.z.string().optional().default('FOCUS'),
    color: zod_1.z.string().optional().default('#8B5CF6'),
    completed: zod_1.z.boolean().optional().default(false),
});
// GET /api/time-chunks
router.get('/', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { start, end, category } = req.query;
        const where = { clerkUserId };
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
        const chunks = await prisma_js_1.default.timeChunk.findMany({
            where,
            orderBy: { startTime: 'asc' },
        });
        res.json(chunks);
    }
    catch (error) {
        console.error('Error fetching time chunks:', error);
        res.status(500).json({ error: 'Failed to fetch time chunks', details: error.message });
    }
});
// POST /api/time-chunks
router.post('/', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const parsed = timeChunkSchema.parse(req.body);
        const startTime = new Date(parsed.startTime);
        const endTime = new Date(parsed.endTime);
        if (endTime <= startTime) {
            res.status(400).json({ error: 'End time must be after start time' });
            return;
        }
        const chunk = await prisma_js_1.default.timeChunk.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        console.error('Error creating time chunk:', error);
        res.status(500).json({ error: 'Failed to create time chunk', details: error.message });
    }
});
// PUT /api/time-chunks/:id
router.put('/:id', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { id } = req.params;
        const parsed = timeChunkSchema.partial().parse(req.body);
        const existing = await prisma_js_1.default.timeChunk.findFirst({
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
        const updated = await prisma_js_1.default.timeChunk.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        console.error('Error updating time chunk:', error);
        res.status(500).json({ error: 'Failed to update time chunk', details: error.message });
    }
});
// PATCH /api/time-chunks/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { id } = req.params;
        const existing = await prisma_js_1.default.timeChunk.findFirst({
            where: { id, clerkUserId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Time chunk not found or unauthorized' });
            return;
        }
        const updated = await prisma_js_1.default.timeChunk.update({
            where: { id },
            data: {
                completed: !existing.completed,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error toggling time chunk status:', error);
        res.status(500).json({ error: 'Failed to toggle status', details: error.message });
    }
});
// DELETE /api/time-chunks/:id
router.delete('/:id', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { id } = req.params;
        const existing = await prisma_js_1.default.timeChunk.findFirst({
            where: { id, clerkUserId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Time chunk not found or unauthorized' });
            return;
        }
        await prisma_js_1.default.timeChunk.delete({
            where: { id },
        });
        res.json({ success: true, message: 'Time chunk deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting time chunk:', error);
        res.status(500).json({ error: 'Failed to delete time chunk', details: error.message });
    }
});
exports.default = router;
