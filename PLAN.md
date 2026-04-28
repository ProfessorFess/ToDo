# HW5 Build Plan — Full-Stack Todo App (Next.js + Prisma + PostgreSQL)

## 0. Goal

Convert the existing HW4 desktop React/Vite app into a Next.js full-stack app with Prisma + Postgres persistence. Hit every rubric item; do not over-build. Target: a repo a grader can clone, run two commands, and see persistent todos working.

---

## 1. Strategy & Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Required by assignment |
| Frontend stack | React 19 + Tailwind v4 + lucide-react | Matches HW4 versions exactly — components port with near-zero changes |
| Database | PostgreSQL via `docker-compose` (local) | Reproducible for grader; no cloud account needed; assignment doesn't require deployment |
| ORM | Prisma | Required by assignment |
| Initial data load | Server Component fetches via Prisma, passes as `initialTasks` prop to a Client Component | Satisfies "Server-Side Data Loading" rubric item directly |
| State management | `useState` in one Client Component (`TodoApp.tsx`), syncs via `fetch` to API routes | Matches HW4's existing pattern, minimal refactor |
| Tabs (Personal/Professional) | Keep purely cosmetic, as in HW4 | HW4 doesn't filter tasks by tab. Adding a category field expands scope beyond rubric. |
| `clearCompleted` | Single `DELETE /api/todos?completed=true` endpoint | One round-trip, simpler than client-side fan-out |

**Scope discipline:** No auth, no users, no deployment, no optimistic UI, no caching strategy, no per-tab filtering. The rubric rewards correct end-to-end data flow, not features.

---

## 2. Final File Structure

```
todo-app/
├── docker-compose.yml          # Postgres service
├── .env                        # DATABASE_URL (gitignored)
├── .env.example                # Template for grader
├── .gitignore
├── README.md                   # Setup + run instructions
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── <timestamp>_init/
│           └── migration.sql
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx            # Server Component — fetches todos
    │   ├── globals.css         # Tailwind v4 + theme tokens (port from HW4 index.css)
    │   └── api/
    │       └── todos/
    │           ├── route.ts            # POST (create), DELETE (clear completed)
    │           └── [id]/
    │               └── route.ts        # PATCH (toggle), DELETE (single)
    ├── components/
    │   ├── TodoApp.tsx         # NEW — Client Component, owns state + API calls
    │   ├── TodoCard.tsx        # ported from HW4
    │   ├── TabBar.tsx          # ported
    │   ├── TaskInput.tsx       # ported
    │   ├── TaskList.tsx        # ported
    │   ├── TaskItem.tsx        # ported
    │   ├── ClearCompletedButton.tsx  # ported
    │   └── Logo.tsx            # ported
    ├── lib/
    │   └── prisma.ts           # Singleton Prisma client (Next dev hot-reload safe)
    └── types/
        └── task.ts             # ported from HW4
```

---

## 3. Database Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Todo {
  id        String   @id @default(cuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

`createdAt` is included so `orderBy: { createdAt: 'asc' }` gives stable ordering across reloads. That's the only field beyond the rubric minimum and it's justified by ordering.

---

## 4. Postgres via docker-compose

`docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: todo
      POSTGRES_PASSWORD: todo
      POSTGRES_DB: todo
    ports:
      - "5432:5432"
    volumes:
      - todo_pgdata:/var/lib/postgresql/data

volumes:
  todo_pgdata:
```

`.env`:

```
DATABASE_URL="postgresql://todo:todo@localhost:5432/todo?schema=public"
```

`.env.example` is identical (no real secrets). Grader copies it to `.env`.

---

## 5. API Route Contracts

All routes return JSON. Validation: assert `text` is a non-empty string for create; assert `completed` is a boolean for update. On bad input return `400`. On missing record return `404`. On unexpected error return `500`.

| Method | Path | Body | Returns | Purpose |
|---|---|---|---|---|
| `POST` | `/api/todos` | `{ text: string }` | `Todo` | Create task |
| `PATCH` | `/api/todos/[id]` | `{ completed?: boolean, text?: string }` | `Todo` | Toggle completion |
| `DELETE` | `/api/todos/[id]` | — | `{ ok: true }` | Delete one task |
| `DELETE` | `/api/todos?completed=true` | — | `{ count: number }` | Clear all completed |

No `GET /api/todos` is needed because the initial list is delivered by the Server Component. Adding one is fine but not required by the rubric.

---

## 6. Component Migration Notes

The HW4 components are presentational and port verbatim with two adjustments:

1. **`'use client'` directive** at the top of any component using `useState`, event handlers, or `crypto.randomUUID`. In practice: `TodoApp.tsx` (new), `TabBar.tsx`, `TaskInput.tsx`, `TaskItem.tsx`, `ClearCompletedButton.tsx`. `TodoCard`, `TaskList`, and `Logo` are pure props-in/JSX-out and inherit client context from their parent.
2. **`crypto.randomUUID()` removal** in `TodoApp.tsx`. IDs now come from the database (cuid). Locally, `addTask` should `await` the `POST` response and append the returned `Todo` rather than fabricate an ID.

`src/app/page.tsx` (Server Component):

```tsx
import { prisma } from "@/lib/prisma";
import { TodoApp } from "@/components/TodoApp";

export default async function Page() {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } });
  return <TodoApp initialTasks={todos} />;
}
```

`src/components/TodoApp.tsx` (Client Component): owns `tasks` and `activeTab` state, mirrors HW4's `App.tsx` logic, but each handler is `async` and calls `fetch` before updating state. The TodoCard is rendered inside it with the same prop shape as HW4.

`src/lib/prisma.ts` — standard Next.js singleton pattern (cache the client on `globalThis` to avoid creating a new one on every dev hot-reload).

---

## 7. Styling Port

HW4's `src/index.css` becomes `src/app/globals.css`. The `@theme` block (custom color tokens like `--color-page`, `--color-card`, `--color-accent`, etc.) and `@import "tailwindcss"` move over directly. Next.js 15's `create-next-app` already sets up Tailwind v4 with PostCSS, so no extra config beyond replacing the default `globals.css` content.

The Inter font: import via `next/font/google` in `layout.tsx` and apply to the `<body>` className. Drop the `<link>` tags from HW4's `index.html` — Next handles the font.

---

## 8. README Content (required for submission)

Sections to include, in order:

1. **Prerequisites** — Node 20+, Docker, npm
2. **Setup**
   ```
   git clone <repo>
   cd todo-app
   cp .env.example .env
   docker compose up -d
   npm install
   npx prisma migrate dev --name init
   npm run dev
   ```
3. **What runs where** — Postgres on `localhost:5432`, app on `localhost:3000`
4. **Project structure** — short version of section 2 of this plan
5. **API routes** — table from section 5
6. **Reset the database** — `docker compose down -v && docker compose up -d && npx prisma migrate dev`

---

## 9. Rubric Coverage Map

| Rubric Item (pts) | Where it's satisfied |
|---|---|
| Frontend Reuse & Integration (20) | All 7 HW4 components ported to `src/components/`; `TodoApp.tsx` adapts HW4's `App.tsx` state logic to receive `initialTasks` prop |
| Prisma Schema & DB Setup (20) | `schema.prisma` Todo model; `prisma migrate dev` produces migration; `lib/prisma.ts` singleton used by all DB access |
| API Routes & Backend Logic (20) | 4 routes in `app/api/todos/` covering create, toggle, delete, clear-completed; all use Prisma; all validate input |
| Server-Side Data Loading (15) | `app/page.tsx` is `async`, calls `prisma.todo.findMany`, passes as prop — no client-side initial fetch |
| Client–Server Communication (15) | Each handler in `TodoApp.tsx` calls `fetch`, awaits response, updates state |
| Persistence & Correctness (10) | Postgres volume `todo_pgdata` survives restarts; `npm run dev` after `docker compose up` shows previous data |

---

## 10. Execution Order for Claude Code

This is the ordered task list. Each step is independently verifiable.

**Phase 1 — Scaffolding**
1. Run `npx create-next-app@latest todo-app --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --no-turbopack` (answer "no" to interactive prompts via flags). Note: pin exact flags to avoid prompts.
2. `cd todo-app`
3. Install deps: `npm install lucide-react prisma @prisma/client`
4. Init Prisma: `npx prisma init --datasource-provider postgresql`
5. Create `docker-compose.yml`, `.env`, `.env.example` per section 4
6. Update `.gitignore` to include `.env` (Next's template usually already does)

**Phase 2 — Database**
7. Replace `prisma/schema.prisma` with section 3 content
8. `docker compose up -d`
9. `npx prisma migrate dev --name init`
10. Create `src/lib/prisma.ts` (singleton)

**Phase 3 — Port HW4 frontend**
11. Create `src/types/task.ts` — copy from HW4 verbatim
12. Copy these files from HW4 `src/components/` to `src/components/`, adding `"use client"` to the top of any file with hooks/handlers (`TabBar`, `TaskInput`, `TaskItem`, `ClearCompletedButton`):
    - `Logo.tsx`, `TabBar.tsx`, `TaskInput.tsx`, `TaskItem.tsx`, `TaskList.tsx`, `ClearCompletedButton.tsx`, `TodoCard.tsx`
13. Replace `src/app/globals.css` with HW4's `src/index.css` content (Tailwind v4 `@theme` block + body styles)
14. Update `src/app/layout.tsx` to load Inter via `next/font/google` and apply font to `<body>`
15. Set `<title>` and `<meta>` in `layout.tsx` metadata

**Phase 4 — Wire up data flow**
16. Create `src/components/TodoApp.tsx` — Client Component, port `App.tsx` logic, accept `initialTasks: Task[]` prop, replace `crypto.randomUUID` with server response IDs, make handlers `async` with `fetch` calls
17. Replace `src/app/page.tsx` with the Server Component shown in section 6

**Phase 5 — API routes**
18. Create `src/app/api/todos/route.ts` — `POST` (create) and `DELETE` (clear completed via `?completed=true` query)
19. Create `src/app/api/todos/[id]/route.ts` — `PATCH` (toggle/update text) and `DELETE` (one task)
20. Each handler: parse JSON, validate, call Prisma, return `NextResponse.json(...)` with appropriate status

**Phase 6 — Verification**
21. `npm run dev`, open `localhost:3000`
22. Add a task → verify it appears
23. Toggle completion → verify checkbox updates
24. Reload page → verify state persists (proves SSR data load + DB persistence)
25. Delete a task → verify removal
26. Mark several complete, click "Clear Completed" → verify removal
27. `docker compose restart db && npm run dev` → verify data still there (proves volume persistence)
28. Run `npx prisma studio` to confirm DB rows match UI

**Phase 7 — Submission prep**
29. Write `README.md` per section 8
30. `git init && git add . && git commit -m "HW5: Full-stack todo with Next.js, Prisma, PostgreSQL"`
31. Push to GitHub, confirm migrations directory is committed (it must be — the rubric requires migration files)

---

## 11. Risks & Gotchas

- **Tailwind v4 + Next.js 15:** `create-next-app` should set this up correctly via `@tailwindcss/postcss`. If `@theme` tokens don't apply, confirm `globals.css` starts with `@import "tailwindcss";` and is imported in `layout.tsx`.
- **Server/Client boundary:** Forgetting `"use client"` on a component using hooks → build error. The fix is always at the top of that file.
- **Migration files in git:** `prisma/migrations/` must be committed — the rubric explicitly checks for them. `.gitignore` should not exclude it.
- **`.env` in git:** `.env` must be gitignored, `.env.example` must be committed.
- **Prisma client generation:** If `@prisma/client` types aren't found, run `npx prisma generate`. `prisma migrate dev` runs this automatically, but worth knowing.
- **Port conflict:** If `5432` is in use locally, change the host port in `docker-compose.yml` (e.g., `"5433:5432"`) and update `DATABASE_URL` to match.

---

## 12. What I'm Explicitly Not Doing

These would all be reasonable additions but expand scope past the rubric. Skip them:

- User authentication / sessions
- Per-tab filtering or a `category` field on `Todo`
- Optimistic UI updates / SWR / React Query
- `revalidatePath` / `revalidateTag` cache strategies
- Edit-task-text UI (HW4 doesn't have it; `PATCH` supports it for completeness only)
- Loading and error states beyond minimal handling
- Tests
- Deployment to Vercel
- A separate `GET /api/todos` endpoint (Server Component covers initial load)
