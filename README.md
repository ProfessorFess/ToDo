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

## Reset the database

```
docker compose down -v
docker compose up -d
npx prisma migrate dev
```
