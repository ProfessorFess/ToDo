# HW5 — Full-Stack Todo (Next.js + Prisma + PostgreSQL)

## Prerequisites

- Node.js 20+
- Docker (Docker Desktop on macOS/Windows)
- npm

## Setup

```
git clone <repo>
cd ToDo
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run dev
```

## What runs where

- PostgreSQL: `localhost:5432` (in Docker, user `todo` / db `todo`)
- Next.js app: `http://localhost:3000`

## Project structure

```
.
├── docker-compose.yml        # Postgres service
├── .env / .env.example       # DATABASE_URL
├── prisma/
│   ├── schema.prisma         # Todo model
│   └── migrations/           # generated migration history (committed)
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Inter font, root layout
│   │   ├── page.tsx          # Server Component — initial load via Prisma
│   │   ├── globals.css       # Tailwind v4 + theme tokens
│   │   └── api/todos/        # POST, DELETE, PATCH/[id], DELETE/[id]
│   ├── components/           # HW4 ports + TodoApp client wrapper
│   ├── lib/prisma.ts         # Prisma singleton
│   └── types/task.ts         # shared Task / Tab types
└── desktop/                  # HW4 source — kept as reference, not part of build
```

## API routes

| Method | Path | Body | Returns | Purpose |
|---|---|---|---|---|
| `POST` | `/api/todos` | `{ text: string }` | `Todo` | Create task |
| `PATCH` | `/api/todos/[id]` | `{ completed?: boolean, text?: string }` | `Todo` | Update task |
| `DELETE` | `/api/todos/[id]` | — | `{ ok: true }` | Delete one task |
| `DELETE` | `/api/todos?completed=true` | — | `{ count: number }` | Clear completed |

The initial todo list is delivered by the Server Component (`src/app/page.tsx`) — there is no `GET /api/todos` route by design.

## Reset the database

```
docker compose down -v
docker compose up -d
npx prisma migrate dev
```
