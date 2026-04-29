# puddings-world

GeniusPudding's personal website

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4

## Install & run

```bash
./scripts/setup.sh && ./scripts/dev.sh    # macOS/Linux
./scripts/setup.ps1; ./scripts/dev.ps1    # Windows
```

App at <http://localhost:3000>.

## Deploy

```bash
./scripts/deploy.sh                # Vercel (default)
DOCKER=1 ./scripts/deploy.sh       # Docker → Cloud Run / Fly.io
```

## Structure

- `app/` — pages + API routes (App Router)
- `app/api/<name>/route.ts` — backend endpoints
- `Dockerfile` — multi-stage build for self-host

Created 2026-04-28.
