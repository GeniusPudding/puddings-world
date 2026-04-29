# puddings-world

GeniusPudding's personal website

## Intent

(Web app: Next.js 15 full-stack. Frontend pages + API routes in one repo.)

## Conventions

- Node ≥ 20. Package manager: **pnpm** (fallback: npm).
- Setup: `./scripts/setup.{sh|ps1}`. Dev: `./scripts/dev.{sh|ps1}` (port 3000).
- Deploy: `./scripts/deploy.{sh|ps1}` — Vercel by default; `DOCKER=1` for Cloud Run/Fly.
- App Router only. Server Components by default; `'use client'` only when needed.
- Tailwind v4 — config in `app/globals.css`, no `tailwind.config.ts`.
- API routes: `app/api/<name>/route.ts`. Health: `GET /api/health`.
- Env: public vars MUST be `NEXT_PUBLIC_*`. Secrets via Vercel/host dashboard.

## Taboos

- No `pages/` directory. App Router only.
- No state libraries until ≥3 components share state.
- No comments explaining WHAT.
- No backwards-compat shims unless explicitly asked.
