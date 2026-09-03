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
const todoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(255),
    description: zod_1.z.string().optional().nullable(),
    dueDate: zod_1.z.string().optional().nullable(),
    allDay: zod_1.z.boolean().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
    completed: zod_1.z.boolean().optional().default(false),
});
// GET /api/todos
router.get('/', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { completed, priority } = req.query;
        const where = { clerkUserId };
        if (completed !== undefined) {
            where.completed = completed === 'true';
        }
        if (priority && typeof priority === 'string') {
            where.priority = priority.toUpperCase();
        }
        const todos = await prisma_js_1.default.todo.findMany({
            where,
            orderBy: [
                { completed: 'asc' },
                { dueDate: 'asc' },
                { createdAt: 'desc' },
            ],
        });
        res.json(todos);
    }
    catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Failed to fetch todos', details: error.message });
    }
});
// POST /api/todos
router.post('/', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const parsed = todoSchema.parse(req.body);
        let allDay = parsed.allDay;
        let dueDate = null;
        if (parsed.dueDate) {
            dueDate = new Date(parsed.dueDate);
            if (allDay === undefined) {
                allDay = parsed.dueDate.length <= 10;
            }
        }
        else {
            allDay = allDay ?? false;
        }
        const todo = await prisma_js_1.default.todo.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Failed to create todo', details: error.message });
    }
});
// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { id } = req.params;
        const parsed = todoSchema.partial().parse(req.body);
        const existing = await prisma_js_1.default.todo.findFirst({
            where: { id, clerkUserId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Todo not found or unauthorized' });
            return;
        }
        const updated = await prisma_js_1.default.todo.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Failed to update todo', details: error.message });
    }
});
// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { id } = req.params;
        const existing = await prisma_js_1.default.todo.findFirst({
            where: { id, clerkUserId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Todo not found or unauthorized' });
            return;
        }
        const updated = await prisma_js_1.default.todo.update({
            where: { id },
            data: {
                completed: !existing.completed,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error toggling todo:', error);
        res.status(500).json({ error: 'Failed to toggle todo status', details: error.message });
    }
});
// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
    try {
        const clerkUserId = req.clerkUserId;
        const { id } = req.params;
        const existing = await prisma_js_1.default.todo.findFirst({
            where: { id, clerkUserId },
        });
        if (!existing) {
            res.status(404).json({ error: 'Todo not found or unauthorized' });
            return;
        }
        await prisma_js_1.default.todo.delete({
            where: { id },
        });
        res.json({ success: true, message: 'Todo deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Failed to delete todo', details: error.message });
    }
});
exports.default = router;
