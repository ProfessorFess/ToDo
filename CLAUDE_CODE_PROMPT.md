# Claude Code Prompt for HW5

Build the complete HW5 full-stack todo application by executing every phase in `PLAN.md` end-to-end. The plan is the source of truth — follow it exactly, in order, without skipping steps or substituting your own design decisions. I will not be available to answer questions, so do not stop to ask; make the most reasonable choice consistent with the plan and continue.

## Inputs you have

- `PLAN.md` in the repo root — the full build plan, 12 sections.
- The HW4 source code, which you need to port. **Before you start Phase 3, fetch it** from the user's GitHub repo. The HW4 desktop app is in the `desktop/` directory of the same repo this plan came from. If you can't determine the repo URL from git remotes (`git remote -v`), ask me once for it, then continue. Files you need to port are listed in Phase 3 of the plan: `Logo.tsx`, `TabBar.tsx`, `TaskInput.tsx`, `TaskItem.tsx`, `TaskList.tsx`, `ClearCompletedButton.tsx`, `TodoCard.tsx`, `types/task.ts`, and `index.css`.

## How to work

1. **Read `PLAN.md` in full before writing any code.** All 12 sections. Sections 3, 4, 5, 6, 8, and 10 contain literal content you should reproduce closely (schema, docker-compose, API contracts, page.tsx skeleton, README structure, ordered steps).

2. **Execute Phase 10's 31 numbered steps in order.** Do not reorder. Do not merge steps. After each phase boundary (Phase 1 → 2 → 3 → ...) print a one-line status: `Phase N complete: <what got done>`.

3. **Run commands yourself.** This includes `npx create-next-app`, `npm install`, `docker compose up -d`, `npx prisma migrate dev`, and `npm run dev`. Do not just write instructions for me. For `create-next-app`, use the exact flag string from Phase 1 step 1 of the plan so it runs non-interactively.

4. **Verification is mandatory, not optional.** Phase 6 (steps 21–28) is part of the build. After `npm run dev` is up, actually exercise the app by hitting the API routes with `curl` to prove they work:
   - `POST /api/todos` with a body, confirm 200 + JSON response
   - `PATCH /api/todos/<id>` toggling completed, confirm response
   - `DELETE /api/todos/<id>`, confirm response
   - `DELETE /api/todos?completed=true`, confirm response
   - Run `npx prisma studio` is not needed; instead run `npx prisma db execute --stdin <<< "SELECT * FROM \"Todo\";"` or use a `psql` one-liner via the docker container to confirm rows.
   - Restart the db container and confirm rows survive.

   Print the curl commands and their responses. If any verification step fails, fix it before moving on.

5. **When something breaks, debug it — don't stop.** If a command fails, read the error, form a hypothesis, fix it, and re-run. Common issues to expect (the plan calls these out in Section 11):
   - Tailwind v4 `@theme` tokens not applying → check `globals.css` is imported in `layout.tsx` and starts with `@import "tailwindcss";`
   - Missing `"use client"` → add it to the top of any component using hooks or event handlers
   - Port 5432 in use → change host port in docker-compose.yml to 5433 and update `DATABASE_URL`
   - `@prisma/client` types missing → run `npx prisma generate`
   - `create-next-app` interactive prompt despite flags → kill it and retry with stdin redirected from `/dev/null`

6. **Do not expand scope.** Section 12 of the plan lists everything you should not build. Do not add auth, do not add per-tab filtering, do not add optimistic updates, do not add tests, do not add a `GET /api/todos` route. If you find yourself reaching for one of these, stop and re-read Section 12.

7. **Preserve HW4's UI exactly.** The ported components should be visually and behaviorally identical to HW4. The only allowed changes are: adding `"use client"` directives, replacing `crypto.randomUUID()` calls with server-returned IDs, and making event handlers `async` to call `fetch`. Do not "improve" the styling, restructure the JSX, or rename props.

8. **Commit at phase boundaries.** After each of the 7 phases completes successfully, make a git commit with message `Phase N: <summary>`. This way if something goes wrong late, the history shows where.

## Constraints

- Node 20+ assumed. If `node --version` shows older, tell me and stop.
- Use npm (not pnpm or yarn) — the plan and HW4 both use npm.
- Use the exact dependency names from Phase 1 step 3: `lucide-react prisma @prisma/client`. No additional libraries.
- Keep the file structure from Section 2 of the plan exactly. Don't introduce new directories.
- The `prisma/migrations/` directory MUST be committed to git. Section 11 explicitly calls this out.
- `.env` MUST be gitignored. `.env.example` MUST be committed.

## Definition of done

You are finished when all of these are true. Do not declare completion until you've checked each one:

- [ ] `npm run dev` serves the app on `localhost:3000` with no console errors
- [ ] All 4 API routes return correct responses to curl tests (verified output shown to me)
- [ ] Adding, toggling, deleting, and clear-completed all work end-to-end via the UI (you can verify via curl + DB inspection since you can't click)
- [ ] Reloading the page shows previously created tasks (server-side load works)
- [ ] Restarting the postgres container preserves data
- [ ] `prisma/migrations/<timestamp>_init/migration.sql` exists and is committed
- [ ] `.env` is gitignored, `.env.example` is committed
- [ ] `README.md` follows Section 8 of the plan with all 6 sections present
- [ ] All 7 git commits exist (one per phase)
- [ ] Final report to me: list of files created, list of commits, and the curl verification output

Begin with `git remote -v` to check whether you can find the HW4 repo URL, then read `PLAN.md` in full, then start Phase 1.
