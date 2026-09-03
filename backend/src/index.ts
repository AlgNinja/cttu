import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express';

import todosRouter from './routes/todos.js';
import eventsRouter from './routes/events.js';
import timeChunksRouter from './routes/timeChunks.js';
import calendarRouter from './routes/calendar.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed CORS origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-dev-user-id'],
  })
);

app.use(express.json());

// Attach Clerk authentication middleware to all incoming requests
app.use(clerkMiddleware());

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clerkKeyConfigured: !process.env.CLERK_SECRET_KEY?.includes('REPLACE_WITH'),
  });
});

// Mount Routes
app.use('/api/todos', todosRouter);
app.use('/api/events', eventsRouter);
app.use('/api/time-chunks', timeChunksRouter);
app.use('/api/calendar', calendarRouter);

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
