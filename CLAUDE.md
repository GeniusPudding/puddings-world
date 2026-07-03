# puddings-world

GeniusPudding's personal website

## Intent

Web app: Next.js 15 full-stack. Frontend pages + API routes in one repo.

This site is a **flexible mount surface**: besides the personal-intro pages, it
hosts UI + backend surfaces for services whose core logic lives in other repos
(current example: Street KTV, whose performer app lives in
`~/Desktop/StreetPerformerMaster/`). Expect more mounts over time — public
demos, client-facing tools, private consoles.

## Cross-project service mounts

Pattern for any service whose home is another repo:

- **Mount points**: UI under `app/playground/<name>/` (fun/public) or
  `app/services/<name>/` (professional); API routes under `app/api/<name>/`;
  backend lib under `lib/<name>/`.
- **Contract ownership**: the cross-project wire contract is OWNED by the
  service's home repo as a machine-readable file + codegen. This repo only
  vendors the generated TS artifact at `lib/<name>/contract.gen.ts`
  (marked DO NOT EDIT) via `./scripts/sync-<name>-contract.{sh|ps1}`.
- **To change a contract**: edit the canonical file in the home repo,
  regenerate there, re-run the sync script here. Never hand-edit either the
  canonical JSON's rendered artifacts or the vendored copy.
- **Street KTV**: canonical = `StreetPerformerMaster/contract/ktv-contract.json`
  (prose spec: `StreetPerformerMaster/app/CLAUDE.md §1.5`); vendored at
  `lib/ktv/contract.gen.ts`; sync via `./scripts/sync-ktv-contract.{sh|ps1}`.
  `lib/ktv/types.ts` keeps KV-internal storage shapes (`ipHash`,
  `cancelToken`) that are deliberately NOT part of the wire contract.

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
