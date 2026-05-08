# Roadmap

Living progress tracker. Boxes flip when shipped. Major milestones get a
date-stamped note in the Done log at the bottom.

## Foundations — shipped

- [x] Next.js 15 + Tailwind v4, deployed on Vercel
- [x] 8-page nav: home, about, interests, musings, projects, services, playground, contact
- [x] Per-project dynamic detail pages (`/projects/[slug]`) with hero slot, long description, prev/next
- [x] `/musings` 3D coverflow carousel (Swiper) for poems / lyrics / dessert stories
- [x] `/interests` data-driven 5-section structure (`content/interests.ts`)
- [x] Weekly GitHub Actions cron → `data/activity.json` (stars, issues, latest commit / release, weekly commit count). Manually triggerable via Run workflow.
- [x] Visitor-routing terminal prompt (`whoami`) on home
- [x] Domain `puddings-world.com` live with HTTPS via Vercel + Cloudflare DNS-only
- [x] SEO basics: favicon, OG image, sitemap, robots, footer
- [x] Hero rebrand: `Pudding builds the world.` + iteration banner
- [x] Home contact section (mailto geniuspuddingforgames@gmail.com)
- [x] **`/playground/street-ktv-menu` v0** — audience-side queue for street-KTV gigs (catalog + tap-to-request + 30s rate limit + Vercel KV backend). **Needs:** Upstash Redis attached on Vercel + `KTV_PERFORMER_KEY` env var. Spec lives at `~/Desktop/StreetPerformerMaster/audience_web/CLAUDE.md`. Performer iOS / Android app still in design.

## Now — next sprint

### Deploy + SEO basics
- [ ] Connect `puddings-world.com` to Vercel project (apex + www, Cloudflare DNS only / grey cloud)
- [ ] Favicon + apple-touch-icon
- [ ] OpenGraph image at `public/og.png`, wired via `metadata.openGraph`
- [ ] `app/robots.ts` and `app/sitemap.ts`
- [ ] Footer with copyright + contact line

### Updates / "what's new" feed
- [ ] `content/updates.ts` schema for hand-authored cross-project narrative entries
- [ ] `<RecentUpdates limit={2}>` component on home between hero and Featured
- [ ] `/log` page with full chronological feed
- [ ] **AI batch-review pipeline** — monthly cron diffs commits across all repos via Claude API, opens a GitHub Issue with 0–3 draft entries; user reviews and promotes to `content/updates.ts`:
  - `scripts/draft-updates.ts` runs 1st of each month
  - `data/last-checkpoint.json` tracks per-repo SHA of last review
  - Drafts land in `data/draft-updates.json`, never auto-promoted
  - Notification via GitHub Issue at-mention

### Content polish (TODO markers in code)
- [ ] `/about` — rewrite "What pulls me back" in own voice
- [ ] `/interests` — fill 5 sections with real content
- [ ] `/playground` — replace placeholder items with real games / demos / links
- [ ] `/contact` — finalize email (likely alias on `puddings-world.com` once live)

### Project hero images
- [ ] Drop `public/projects/<slug>.png` per active project
- [ ] Set `image: "/projects/<slug>.png"` on each entry in `content/projects.ts`

## Later — staged data collection

### Layer 1: basic page views (lowest effort)
- [ ] Add `@vercel/analytics`, mount `<Analytics />` in root layout. Free tier covers page views / referrer / country / device. No cookies, GDPR-friendly out of the box.

### Layer 2: custom events (do when ready to act on data)
- [ ] **PostHog** integration (free 1M events / month). Capture:
  - `whoami_picked` with identity (hacker / client / researcher / curious / friend)
  - `service_block_clicked` per service
  - `outbound_repo_clicked` per project slug
- [ ] Wrap in `lib/track.ts` so PostHog is swappable later

### Layer 3: backend persistence (when a use case exists)
- [ ] `app/api/track/route.ts` POST endpoint → Vercel KV or Postgres
- [ ] Use cases that justify the upgrade:
  - Contact form / inquiry log
  - Returning-visitor personalization (remember prior `whoami` pick)
  - Newsletter signup
  - Mini-game leaderboard

## Eventually — big-ticket items

- [ ] Mobile nav drawer (current Nav wraps; passable but not polished)
- [ ] Per-project architecture diagrams (Mermaid or hand-drawn SVG)
- [ ] InvisibleGo web playable build embedded on its detail page
- [ ] CV / resume page with PDF export
- [ ] RSS feed of `/log`
- [ ] Newsletter (Buttondown / Resend) — only after a publishing rhythm exists
- [ ] Lighthouse / axe pass; reduced-motion handling

## Done log

- 2026-04-28 Multi-page restructure (home hero + whoami router)
- 2026-04-28 Project detail pages, medical-research repos refresh (jamesforhealth → puddingforhealth, FlowFusionBP / EPG-LatentFlow / PPG-PulseFlowBP added)
- 2026-04-28 `/about` enriched, `/interests` added, `/now` renamed to `/playground`
