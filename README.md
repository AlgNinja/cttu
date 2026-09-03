# FocusFlow • Full-Stack Productivity Hub

A modern full-stack application for managing **Tasks with Due Dates**, **Upcoming Events**, and **Time Chunking (Focus Blocks)** with an interactive **Unified Calendar View**. Built with user isolation so each user only sees and modifies their own data via **Clerk Authentication**.

---

## 🌟 Key Features

1. **Tasks / Todos (with Due Dates & Priority)**
   - Create, edit, toggle, and delete tasks.
   - Priority levels: `High`, `Medium`, and `Low`.
   - Real-time overdue badges and due-today indicators.
   - Filter by status (*All*, *Pending*, *Completed*) and priority.

2. **Upcoming Events**
   - Schedule events and meetings with start/end times or all-day toggles.
   - Attach locations or meeting links.
   - Color presets for visual categorization.
   - Grouped into upcoming and past events.

3. **Time Chunking (Deep Work & Focus Blocks)**
   - Protect dedicated blocks of time for deep focus, study, work, meetings, exercise, and breaks.
   - Daily focus counter and completed time statistics.
   - Visual duration badges (e.g., `45m`, `1h 30m`).

4. **Unified Interactive Calendar View**
   - Powered by FullCalendar with Month, Week, and Day views.
   - Aggregates Todos (due dates), Events, and Time Chunks with distinct color coding.
   - **Click any item** to view details, toggle status, edit fields, or delete.
   - **Click any date or time slot** to quickly add a Task, Event, or Time Chunk.
   - **Drag & drop or resize** items directly on the calendar to update dates and times.
   - Filter toggles to show/hide any category on the fly.

5. **Security & User Isolation**
   - Clerk authentication middleware on the Express backend.
   - All queries, mutations, and database records are strictly scoped by the authenticated user's `clerkUserId`.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Express.js with TypeScript, Prisma ORM, `@clerk/express`, Zod validation.
- **Database**: PostgreSQL 16 Alpine running in Docker.
- **Frontend**: React 19 with TypeScript, Vite, Tailwind CSS v4, FullCalendar, Lucide Icons, `@clerk/clerk-react`.

---

## 🚀 Running Locally with Docker PostgreSQL

Follow this step-by-step guide to run the full-stack application on your local machine using the PostgreSQL Docker container.

### 📋 Prerequisites
* **Docker** & **Docker Compose** (Docker Desktop on Windows/macOS or Docker Engine on Linux)
* **Node.js** (v18 or higher) and **npm**

---

### Step 1: Configure Environment Variables

1. **Backend Environment** (`backend/.env`):
   Ensure your `DATABASE_URL` points to your local Docker container on `localhost:5432`:
   ```env
   PORT=5000

   # Local PostgreSQL Docker Container Connection:
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cttu_db?schema=public"

   # Your Clerk Authentication Keys (https://dashboard.clerk.com):
   CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."

   # Allowed Frontend Origin:
   CORS_ORIGIN="http://localhost:5173"
   ```

2. **Frontend Environment** (`frontend/.env`):
   Ensure the frontend connects to your local backend API and has your Clerk publishable key:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."
   VITE_API_URL="http://localhost:5000/api"
   ```

---

### Step 2: Start the PostgreSQL Docker Container

From the project root directory, launch the PostgreSQL container in the background:

```bash
# Using npm shortcut:
npm run docker:up

# Or directly with Docker Compose:
docker compose up -d
```

#### Check Container Health
Verify that the container is up and healthy:
```bash
docker compose ps
```
You should see:
```text
NAME            IMAGE          COMMAND                  SERVICE    STATUS
cttu_postgres   postgres:15    "docker-entrypoint.s…"   postgres   Up (healthy)   0.0.0.0:5432->5432/tcp
```

To view live database logs:
```bash
npm run docker:logs
# or: docker compose logs -f postgres
```

---

### Step 3: Initialize Database Schema (Prisma)

Once the container is healthy, run Prisma to generate the client and push the schema tables to your local PostgreSQL container:

```bash
# Push schema tables to the PostgreSQL container
npm run db:push

# Generate the TypeScript Prisma Client
npm run db:generate
```

*(Optional)* **Prisma Studio GUI**:
Open an interactive database browser in your web browser at `http://localhost:5555`:
```bash
npm run db:studio
```

---

### Step 4: Start the Backend & Frontend

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
npm run dev:backend
# Starts Express server at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# Starts React Vite client at http://localhost:5173
```

Open your browser to `http://localhost:5173`. Log in with Clerk, and start adding tasks, events, and focus chunks!

---

## 🛠️ Docker Container Management & Useful Commands

| Task | Command |
| :--- | :--- |
| **Start Postgres container** | `npm run docker:up` *(or `docker compose up -d`)* |
| **Stop Postgres container** | `npm run docker:down` *(or `docker compose down`)* |
| **View Postgres logs** | `npm run docker:logs` *(or `docker compose logs -f postgres`)* |
| **Open Prisma Studio GUI** | `npm run db:studio` |
| **Connect to `psql` inside container** | `docker exec -it cttu_postgres psql -U postgres -d cttu_db` |
| **Wipe data & reset fresh database** | `docker compose down -v` *(removes volume)* then `docker compose up -d && npm run db:push` |

> [!NOTE]
> **Data Persistence**: The container uses a named Docker volume (`postgres_data`). All your tasks, events, and user data remain safely saved on your computer even when you shut down the container using `docker compose down`.

---

## ❓ Troubleshooting Local Docker Setup

### 1. Port 5432 is Already in Use
* **Cause**: A local instance of PostgreSQL is already running on your host machine outside of Docker.
* **Fix**:
  * On Linux/macOS: Run `sudo lsof -i :5432` to find the process ID and stop it (`sudo systemctl stop postgresql` or `brew services stop postgresql`).
  * Or edit `docker-compose.yml` to map to a different host port (e.g. `"5433:5432"`) and update `DATABASE_URL` in `backend/.env` to port `5433`.

### 2. Docker Daemon Not Running
* **Cause**: Docker Desktop or the Docker daemon is closed.
* **Fix**: Launch Docker Desktop, or on Linux run `sudo systemctl start docker`.

### 3. Prisma Connection Error (`P1001: Can't reach database server`)
* Verify the container is running with `docker compose ps`.
* Check container logs with `docker compose logs postgres` to ensure Postgres initialized successfully.
* Ensure `DATABASE_URL` in `backend/.env` is set to `localhost:5432`.

---

## 📁 Project Structure

```
cttu/
├── docker-compose.yml          # PostgreSQL 16 service with volume persistence
├── package.json                # Root convenience scripts
├── README.md                   # Project documentation
├── backend/
│   ├── .env                    # Pre-configured with PORT, DB URL, and Clerk placeholders
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma       # Models for Todo, Event, and TimeChunk
│   └── src/
│       ├── index.ts            # Express server entry point with CORS & Clerk
│       ├── lib/
│       │   └── prisma.ts       # Prisma Client singleton
│       ├── middleware/
│       │   └── auth.ts         # Clerk session token validator & user scoping
│       └── routes/
│           ├── todos.ts        # Full CRUD for Tasks (scoped to clerkUserId)
│           ├── events.ts       # Full CRUD for Events (scoped to clerkUserId)
│           ├── timeChunks.ts   # Full CRUD for Time Chunks (scoped to clerkUserId)
│           └── calendar.ts     # Unified calendar aggregation endpoint
└── frontend/
    ├── .env                    # Pre-configured with VITE_CLERK_PUBLISHABLE_KEY
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts          # Vite configuration with Tailwind CSS v4
    └── src/
        ├── App.tsx             # Main layout, tab navigation, state management
        ├── main.tsx            # React root with ClerkProvider & setup guard
        ├── index.css           # Tailwind styling & FullCalendar customizations
        ├── types/              # TypeScript interfaces for all entities
        ├── services/
        │   └── api.ts          # Authenticated API client with Clerk token injection
        └── components/
            ├── Navbar.tsx      # Top bar with tabs, counts, and Clerk UserButton
            ├── Calendar/
            │   ├── CalendarView.tsx      # FullCalendar Month/Week/Day with drag & drop
            │   └── UnifiedItemModal.tsx  # View, edit, toggle, or delete any item
            ├── Todos/
            │   ├── TodoList.tsx          # Task list with priority, due dates & filters
            │   └── TodoModal.tsx         # Create / Edit task modal
            ├── Events/
            │   ├── EventList.tsx         # Upcoming vs Past events list
            │   └── EventModal.tsx        # Create / Edit event modal
            ├── TimeChunking/
            │   ├── TimeChunkList.tsx     # Focus block timeline & duration stats
            │   └── TimeChunkModal.tsx    # Create / Edit time chunk modal
            └── Common/
                ├── Modal.tsx             # Reusable modal dialog
                └── SetupBanner.tsx       # Instructions when Clerk keys are pending
```
