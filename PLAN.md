# HW5 Build Plan — Full-Stack Todo App (Next.js + Prisma + PostgreSQL)

## 0. Goal

Convert the existing HW4 desktop React/Vite app into a Next.js full-stack app with Prisma + Postgres persistence. Hit every rubric item; do not over-build. Target: a repo a grader can clone, run two commands, and see persistent todos working.

## 0.1. Repo Starting State (assumed)

The HW5 repo already exists and contains:

```
hw5-repo/
├── .git/
├── PLAN.md                   # this file
├── CLAUDE_CODE_PROMPT.md     # (optional) the build prompt
└── desktop/                  # HW4 source — copied in for reference & porting
    ├── src/
    │   ├── App.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   ├── components/
    │   │   ├── ClearCompletedButton.tsx
    │   │   ├── Logo.tsx
    │   │   ├── TabBar.tsx
    │   │   ├── TaskInput.tsx
    │   │   ├── TaskItem.tsx
    │   │   ├── TaskList.tsx
    │   │   └── TodoCard.tsx
    │   └── types/task.ts
    ├── package.json
    ├── tsconfig.json
    └── ... (other Vite scaffold files)
```

The Next.js application will be installed **at the repo root**, not in a subfolder. `desktop/` stays in the repo as reference material — it's not part of the running app, and it doubles as evidence to the grader that HW4 is being reused.

---

## 1. Strategy & Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Required by assignment |
| Frontend stack | React 19 + Tailwind v4 + lucide-react | Matches HW4 versions exactly — components port with near-zero changes |
| Database | PostgreSQL via `docker-compose` (local) | Reproducible for grader; no cloud account needed; assignment doesn't require deployment |
| ORM | Prisma | Required by assignment |
| App location | Repo root (not a subfolder) | Standard convention; grader runs commands at root |
| HW4 source | `./desktop/` — read-only, port files **out of** it | User copied it in; keep it as a reference folder |
| Initial data load | Server Component fetches via Prisma, passes as `initialTasks` prop to a Client Component | Satisfies "Server-Side Data Loading" rubric item directly |
| State management | `useState` in one Client Component (`TodoApp.tsx`), syncs via `fetch` to API routes | Matches HW4's existing pattern, minimal refactor |
| Tabs (Personal/Professional) | Keep purely cosmetic, as in HW4 | HW4 doesn't filter tasks by tab. Adding a category field expands scope beyond rubric. |
| `clearCompleted` | Single `DELETE /api/todos?completed=true` endpoint | One round-trip, simpler than client-side fan-out |

**Scope discipline:** No auth, no users, no deployment, no optimistic UI, no caching strategy, no per-tab filtering. The rubric rewards correct end-to-end data flow, not features.

---

## 2. Final File Structure

After the build, the repo looks like:

```
hw5-repo/
├── .git/
├── .gitignore                # from Next.js scaffold + ignores .env, /desktop/node_modules
├── .env                      # DATABASE_URL (gitignored)
├── .env.example              # Template for grader
├── PLAN.md
├── CLAUDE_CODE_PROMPT.md     # (if you kept it)
├── README.md                 # rewritten — setup + run instructions
├── docker-compose.yml        # Postgres service
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json             # MUST exclude "desktop" — see Phase 1 step 6
├── postcss.config.mjs
├── next-env.d.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── <timestamp>_init/
│           └── migration.sql
├── public/                   # from Next.js scaffold (favicon etc.)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Server Component — fetches todos
│   │   ├── globals.css       # Tailwind v4 + theme tokens (port from desktop/src/index.css)
│   │   └── api/
│   │       └── todos/
│   │           ├── route.ts          # POST (create), DELETE (clear completed)
│   │           └── [id]/
│   │               └── route.ts      # PATCH (toggle), DELETE (single)
│   ├── components/
│   │   ├── TodoApp.tsx       # NEW — Client Component, owns state + API calls
│   │   ├── TodoCard.tsx      # ported from desktop/
│   │   ├── TabBar.tsx        # ported
│   │   ├── TaskInput.tsx     # ported
│   │   ├── TaskList.tsx      # ported
│   │   ├── TaskItem.tsx      # ported
│   │   ├── ClearCompletedButton.tsx  # ported
│   │   └── Logo.tsx          # ported
│   ├── lib/
│   │   └── prisma.ts         # Singleton Prisma client (Next dev hot-reload safe)
│   └── types/
│       └── task.ts           # ported from desktop/
└── desktop/                  # HW4 source — kept as reference, ignored by tsconfig
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

The HW4 components (in `./desktop/src/components/`) are presentational and port verbatim with two adjustments:

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

`src/components/TodoApp.tsx` (Client Component): owns `tasks` and `activeTab` state, mirrors `desktop/src/App.tsx` logic, but each handler is `async` and calls `fetch` before updating state. The `TodoCard` is rendered inside it with the same prop shape as HW4.

`src/lib/prisma.ts` — standard Next.js singleton pattern (cache the client on `globalThis` to avoid creating a new one on every dev hot-reload).

---

## 7. Styling Port

Copy `./desktop/src/index.css` into `src/app/globals.css`. The `@theme` block (custom color tokens like `--color-page`, `--color-card`, `--color-accent`, etc.) and `@import "tailwindcss"` move over directly. Next.js 15's `create-next-app` already sets up Tailwind v4 with PostCSS, so no extra config beyond replacing the default `globals.css` content.

The Inter font: import via `next/font/google` in `layout.tsx` and apply to the `<body>` className. Drop the `<link>` tags from HW4's `index.html` — Next handles the font.

---

## 8. README Content (required for submission)

Sections to include, in order:

1. **Prerequisites** — Node 20+, Docker, npm
2. **Setup**
   ```
   git clone <repo>
   cd hw5-repo
   cp .env.example .env
   docker compose up -d
   npm install
   npx prisma migrate dev --name init
   npm run dev
   ```
3. **What runs where** — Postgres on `localhost:5432`, app on `localhost:3000`
4. **Project structure** — short version of section 2 of this plan; mention `desktop/` is HW4 reference source
5. **API routes** — table from section 5
6. **Reset the database** — `docker compose down -v && docker compose up -d && npx prisma migrate dev`

---

## 9. Rubric Coverage Map

| Rubric Item (pts) | Where it's satisfied |
|---|---|
| Frontend Reuse & Integration (20) | All 7 HW4 components ported from `./desktop/src/components/` to `src/components/`; `TodoApp.tsx` adapts HW4's `App.tsx` state logic to receive `initialTasks` prop. `desktop/` retained in repo as evidence. |
| Prisma Schema & DB Setup (20) | `schema.prisma` Todo model; `prisma migrate dev` produces migration; `lib/prisma.ts` singleton used by all DB access |
| API Routes & Backend Logic (20) | 4 routes in `app/api/todos/` covering create, toggle, delete, clear-completed; all use Prisma; all validate input |
| Server-Side Data Loading (15) | `app/page.tsx` is `async`, calls `prisma.todo.findMany`, passes as prop — no client-side initial fetch |
| Client–Server Communication (15) | Each handler in `TodoApp.tsx` calls `fetch`, awaits response, updates state |
| Persistence & Correctness (10) | Postgres volume `todo_pgdata` survives restarts; `npm run dev` after `docker compose up` shows previous data |

---

## 10. Execution Order for Claude Code

This is the ordered task list. Each step is independently verifiable. **Run all commands from the repo root.**

**Phase 1 — Scaffolding (into a non-empty repo)**

`create-next-app` won't install into a non-empty directory, so we scaffold into a temp folder, then merge into root.

1. From repo root, scaffold into a temp subfolder:
   ```
   npx create-next-app@latest _scaffold --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --no-turbopack --use-npm
   ```
2. Move scaffold contents up to repo root (explicit list — do NOT use blanket globs that might overwrite `PLAN.md`, `desktop/`, or `.git/`):
   ```
   mv _scaffold/package.json _scaffold/package-lock.json _scaffold/tsconfig.json _scaffold/next.config.ts _scaffold/next-env.d.ts _scaffold/postcss.config.mjs _scaffold/.gitignore _scaffold/src _scaffold/public .
   rm -rf _scaffold
   ```
   (Discard the scaffold's `README.md` — we'll write our own in Phase 7.)
3. Install extra deps:
   ```
   npm install lucide-react prisma @prisma/client
   ```
4. Init Prisma:
   ```
   npx prisma init --datasource-provider postgresql
   ```
   This creates `prisma/schema.prisma` and adds `DATABASE_URL=...` to `.env` (creating `.env` if absent). Overwrite both files in the next step.
5. Create `docker-compose.yml`, overwrite `.env` (with the docker-compose URL from section 4), and create `.env.example` with the same content.
6. **Edit `tsconfig.json`**: add `"desktop"` to the `exclude` array. If no `exclude` exists, add one:
   ```json
   "exclude": ["node_modules", "desktop"]
   ```
   Without this, TypeScript will try to type-check `desktop/src/**/*.tsx` and fail. This step is mandatory.
7. Verify `.gitignore` includes `.env`, `node_modules`, `.next`, and add `desktop/node_modules` (in case the user copied that folder with deps installed). Append any missing entries.

**Phase 2 — Database**

8. Replace `prisma/schema.prisma` contents with section 3.
9. `docker compose up -d` — confirm with `docker compose ps` that the db service is running.
10. `npx prisma migrate dev --name init` — this creates `prisma/migrations/<timestamp>_init/migration.sql`. Confirm the file exists.
11. Create `src/lib/prisma.ts` (singleton pattern).

**Phase 3 — Port HW4 frontend from `./desktop/`**

12. Create `src/types/task.ts` — copy verbatim from `desktop/src/types/task.ts`.
13. For each of these files, copy from `desktop/src/components/<file>` to `src/components/<file>`:
    - `Logo.tsx`, `TabBar.tsx`, `TaskInput.tsx`, `TaskItem.tsx`, `TaskList.tsx`, `ClearCompletedButton.tsx`, `TodoCard.tsx`
    
    Then add `"use client";` as the first line of the files that use hooks/handlers: `TabBar.tsx`, `TaskInput.tsx`, `TaskItem.tsx`, `ClearCompletedButton.tsx`. Leave `Logo.tsx`, `TaskList.tsx`, and `TodoCard.tsx` without the directive (they're pure presentational).
14. Replace `src/app/globals.css` with the contents of `desktop/src/index.css` (the Tailwind `@import` + `@theme` block + body styles).
15. Update `src/app/layout.tsx`: load Inter via `next/font/google`, apply to `<body>`, set the page `<title>` (e.g., "TODO") in `metadata`.

**Phase 4 — Wire up data flow**

16. Create `src/components/TodoApp.tsx` — Client Component. Port logic from `desktop/src/App.tsx`. Differences:
    - Accept `initialTasks: Task[]` prop, use as initial `useState` value
    - `addTask`: `POST /api/todos`, append response body to state (no `crypto.randomUUID`)
    - `toggleTask`: `PATCH /api/todos/<id>` with `{ completed: !current }`, update state from response
    - `deleteTask`: `DELETE /api/todos/<id>`, remove from state on success
    - `clearCompleted`: `DELETE /api/todos?completed=true`, filter state on success
17. Replace `src/app/page.tsx` with the Server Component shown in section 6.

**Phase 5 — API routes**

18. Create `src/app/api/todos/route.ts`:
    - `POST`: parse body, validate `text` is non-empty string, `prisma.todo.create`, return 201 + Todo
    - `DELETE`: only act when `?completed=true` query is present, run `prisma.todo.deleteMany({ where: { completed: true } })`, return `{ count }`
19. Create `src/app/api/todos/[id]/route.ts`:
    - `PATCH`: parse body, validate `completed` (boolean) or `text` (string), `prisma.todo.update`, return updated Todo. Return 404 if not found (catch P2025).
    - `DELETE`: `prisma.todo.delete`, return `{ ok: true }`. Return 404 on P2025.
20. Each handler wraps work in try/catch, returns `NextResponse.json(...)` with the right status.

**Phase 6 — Verification**

21. `npm run dev` in one terminal. Confirm no errors in the build output.
22. In another terminal, exercise each route with curl. Capture and review responses:
    ```
    curl -s -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"text":"first task"}'
    curl -s -X POST http://localhost:3000/api/todos -H "Content-Type: application/json" -d '{"text":"second task"}'
    # capture an id from the responses, then:
    curl -s -X PATCH http://localhost:3000/api/todos/<id> -H "Content-Type: application/json" -d '{"completed":true}'
    curl -s -X DELETE "http://localhost:3000/api/todos?completed=true"
    curl -s -X DELETE http://localhost:3000/api/todos/<other-id>
    ```
23. Reload `localhost:3000` in browser → confirm tasks persist (proves SSR data load).
24. Confirm DB rows directly:
    ```
    docker compose exec db psql -U todo -d todo -c 'SELECT * FROM "Todo";'
    ```
25. Restart the db container, then reload the page:
    ```
    docker compose restart db
    ```
    Tasks should still be there (proves volume persistence).

**Phase 7 — Submission prep**

26. Write `README.md` per section 8.
27. The repo already has `.git/`, so do NOT run `git init`. Stage and commit:
    ```
    git add .
    git commit -m "HW5: Full-stack todo with Next.js, Prisma, PostgreSQL"
    ```
28. Confirm the commit includes `prisma/migrations/` and excludes `.env`:
    ```
    git ls-files | grep -E '(\.env$|prisma/migrations/)'
    ```
    Expect to see migration files listed and `.env` NOT listed.
29. Push to GitHub.

---

## 11. Risks & Gotchas

- **Tailwind v4 + Next.js 15:** `create-next-app` should set this up correctly via `@tailwindcss/postcss`. If `@theme` tokens don't apply, confirm `globals.css` starts with `@import "tailwindcss";` and is imported in `layout.tsx`.
- **Server/Client boundary:** Forgetting `"use client"` on a component using hooks → build error. The fix is always at the top of that file.
- **`tsconfig.json` must exclude `desktop/`** — Next's default `tsconfig.json` includes `**/*.tsx`, which would pull in HW4's source and produce duplicate-symbol or type errors. Phase 1 step 6 handles this; if you see weird type errors from `desktop/...`, this is why.
- **Migration files in git:** `prisma/migrations/` must be committed — the rubric explicitly checks for them. `.gitignore` should not exclude it.
- **`.env` in git:** `.env` must be gitignored, `.env.example` must be committed. `prisma init` may create a default `.env` — overwrite it with the docker-compose URL.
- **Prisma client generation:** If `@prisma/client` types aren't found, run `npx prisma generate`. `prisma migrate dev` runs this automatically, but worth knowing.
- **Port conflict:** If `5432` is in use locally, change the host port in `docker-compose.yml` (e.g., `"5433:5432"`) and update `DATABASE_URL` to match.
- **Multiple lockfiles warning:** Next.js may warn that it found `desktop/package-lock.json` in addition to the root one. This is harmless. If it bothers you, set `outputFileTracingRoot: __dirname` in `next.config.ts`.
- **`desktop/` accidentally getting deleted:** Don't blanket-glob during the Phase 1 scaffold merge. Use the explicit `mv` list from step 2.

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
- Removing `desktop/` from the repo (it's fine to leave as reference)
