"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_2 = require("@clerk/express");
const todos_js_1 = __importDefault(require("./routes/todos.js"));
const events_js_1 = __importDefault(require("./routes/events.js"));
const timeChunks_js_1 = __importDefault(require("./routes/timeChunks.js"));
const calendar_js_1 = __importDefault(require("./routes/calendar.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Allowed CORS origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id'],
}));
app.use(express_1.default.json());
// Attach Clerk authentication middleware to all incoming requests
app.use((0, express_2.clerkMiddleware)());
// Healthcheck
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        clerkKeyConfigured: !process.env.CLERK_SECRET_KEY?.includes('REPLACE_WITH'),
    });
});
// Mount Routes
app.use('/api/todos', todos_js_1.default);
app.use('/api/events', events_js_1.default);
app.use('/api/time-chunks', timeChunks_js_1.default);
app.use('/api/calendar', calendar_js_1.default);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    });
});
app.listen(PORT, () => {
    console.log(`🚀 CTTU Backend server running on http://localhost:${PORT}`);
    console.log(`📅 Clerk Auth integrated. Scoped per user ID.`);
});
