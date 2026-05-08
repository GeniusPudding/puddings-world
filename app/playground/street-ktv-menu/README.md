# Street KTV — audience web

Live at: <https://puddings-world.com/playground/street-ktv-menu>

The audience-facing surface for street-KTV gigs. Listeners scan a QR
code on a sign, browse the songbook, and tap to add a song to the live
queue. The performer's iOS / Android app reads the same queue from
Vercel KV and plays songs from there. The performer app also writes
back which song is currently playing, so the web shows that live too.

The performer app itself lives in a separate repo
(`~/Desktop/StreetPerformerMaster/`); only the audience web is here.

## Where the things live

| Thing | File / location | Edited by |
|---|---|---|
| **Songbook** (catalog) | [`content/ktv-catalog.ts`](../../../content/ktv-catalog.ts) | You — push to deploy |
| Audience UI | [`page.tsx`](./page.tsx) + [`_components/KtvMenu.tsx`](./_components/KtvMenu.tsx) | Engineering |
| API route handlers | [`app/api/ktv/`](../../api/ktv/) | Engineering |
| Backend lib (KV / auth / rate-limit / types) | [`lib/ktv/`](../../../lib/ktv/) | Engineering |
| Queue + state | Vercel KV (Upstash Redis), keys `ktv:queue` and `ktv:state` | Both audience POST and performer app |
| Spec doc (handoff to performer app) | `~/Desktop/StreetPerformerMaster/audience_web/CLAUDE.md` | Cross-team |

### Editing the songbook

Open `content/ktv-catalog.ts`. Each entry:

```ts
{
  id: 'moon-tells-my-heart',  // stable URL-safe slug; queue references this
  title: '月亮代表我的心',
  artist: '鄧麗君',
  language: 'zh',             // 'zh' | 'en' | 'jp' | 'ko' | 'other'
  key: 'C',                   // optional — performer key (e.g. 'C', 'Capo 3')
  durationSec: 220,           // optional
  tags: ['ballad'],           // optional, freeform
}
```

Add / remove / edit entries, then `git push`. Vercel auto-redeploys
the whole site within ~1 minute. **Don't rename an existing `id`
mid-gig** — pending queue items reference it by id and will go stale.

## Tech stack

- **Next.js 15** App Router. `page.tsx` is a server component that
  imports the catalog and hands it to a client component.
- **Vercel KV (Upstash Redis)** as the cross-platform shared queue.
  Two keys total: `ktv:queue` (JSON array of QueueItem), `ktv:state`
  (JSON object: `acceptingRequests`, `nowPlayingId`, `updatedAt`).
- **`@upstash/redis`** SDK in `lib/ktv/kv.ts` (lazy client; no env =
  graceful 503).
- **Bearer-token auth** for performer-only endpoints (`KTV_PERFORMER_KEY`
  env var, constant-time compare in `lib/ktv/auth.ts`).
- **Rate-limit** via SHA-256 of client IP + Redis `SET NX EX` (atomic);
  30-second cooldown per IP.
- **Tailwind v4** for styles, sharing the main site's `@theme` tokens.
  No extra design system.

## How it flows (point-by-point)

```
   Audience phone (web)            Vercel KV                Performer app
                                  (single source             (iOS / Android)
                                   of truth)
   GET  /api/ktv/state ─────────► ktv:state ─────────────►  PATCH /api/ktv/state
        (poll every 5s,                                       (set nowPlayingId,
         public)                                               flip acceptingRequests)

   POST /api/ktv/queue ─────────► ktv:queue ─────────────►  GET  /api/ktv/queue
        (anonymous,                                           (poll every 3s,
         rate-limited)                                         bearer auth)
                                                            DELETE /api/ktv/queue/:id
                                                              (after singing it)
                                                            DELETE /api/ktv/queue
                                                              (clear all between gigs)
```

A typical request → playback round-trip:

1. Audience scans QR → opens the audience web → sees songbook + live queue
2. Audience taps a song → confirm sheet pops up → confirm
3. POST to `/api/ktv/queue`. KV gets a new entry. Audience sees position.
4. Performer app polls `/api/ktv/queue` every 3 s. Sees the new entry.
5. Performer app picks the next song to play (auto = first item, or
   manual = performer picks). Calls `PATCH /api/ktv/state
   { nowPlayingId: <queueItem.id> }` and starts audio playback locally.
6. Audience web's next 5 s poll picks up the new `nowPlayingId` →
   shows "Now playing" tile.
7. Performer app finishes the song, calls `DELETE /api/ktv/queue/<id>`
   plus `PATCH /api/ktv/state { nowPlayingId: <next.id or null> }`.
8. Audience web sees queue advance and "Now playing" change.

The audience web **never directly tells the performer app to play a song** —
that responsibility is entirely on the app side. The web just adds rows
to the queue; the app polls and decides when / what to play.

### Audio output (performer app's job, not web's)

Where the audio actually comes out — phone speaker, Bluetooth speaker,
aux to amplifier, etc. — is decided by the performer app and its
device. The web has no opinion and no involvement.

## API contract

All endpoints under `/api/ktv/`. All return JSON unless noted.

### `GET /api/ktv/state` — public

Returns current state plus the full queue (with PII stripped).

```json
{
  "acceptingRequests": true,
  "nowPlayingId": "abc123",
  "nowPlaying": { "songId": "moon-tells-my-heart", "title": "月亮代表我的心", "artist": "鄧麗君" },
  "queue": [
    { "id": "def456", "songId": "ningxia", "title": "寧夏", "artist": "梁靜茹", "addedAt": "2026-05-08T14:00:00Z" },
    { "id": "ghi789", "songId": "imagine", "title": "Imagine", "artist": "John Lennon", "addedAt": "2026-05-08T14:01:00Z" }
  ]
}
```

The `queue` excludes the now-playing item. The audience web polls this
every 5 seconds.

### `PATCH /api/ktv/state` — performer-only

Update `acceptingRequests` and / or `nowPlayingId`. Either field
optional; missing fields keep current value.

```http
PATCH /api/ktv/state
Authorization: Bearer <KTV_PERFORMER_KEY>

{ "acceptingRequests": false, "nowPlayingId": "abc123" }
```

### `POST /api/ktv/queue` — public

Submit a song request.

```http
POST /api/ktv/queue
Content-Type: application/json

{ "songId": "moon-tells-my-heart" }
```

- 200 `{ id, position, queueLength }` — added
- 403 `not_accepting` — performer closed the queue
- 404 `unknown_song` — songId not in catalog
- 409 `duplicate` — that song already in queue (returns its position)
- 429 `rate_limit` — same IP submitted within the last 30 seconds
- 503 `kv_unavailable` — backend not provisioned (see Setup below)

The body also accepts optional `requesterName` and `message` (≤ 30 /
≤ 200 chars), but the audience UI no longer sends them. They're kept
in the contract for future re-enable.

### `GET /api/ktv/queue` — performer-only

Full queue with joined catalog info (and internal fields for the
performer's own UI). Anonymous callers should use `GET /api/ktv/state`
instead.

### `DELETE /api/ktv/queue` — performer-only

Empties the queue. Call this between gigs to start clean.

### `DELETE /api/ktv/queue/:id` — performer-only

Removes one specific item by id. Call after the song's been sung, or
to skip a request.

## Setup (one-time per Vercel project)

You only need to do this once for the puddings-world Vercel project.

### 1. Provision Upstash Redis

1. Vercel project → **Storage** → **Create Database** → **Upstash for Redis**
2. Free tier, region close to deploy (Tokyo / Singapore for AU/NZ/Asia)
3. **Connect to project** = `puddings-world`, all three environments
4. This auto-injects: `KV_REST_API_URL`, `KV_REST_API_TOKEN`,
   `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, `REDIS_URL`

### 2. Add `KTV_PERFORMER_KEY`

1. Generate a 32-char alphanumeric:
   ```powershell
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % { [char]$_ })
   ```
   ```bash
   openssl rand -hex 16
   ```
2. Vercel project → **Settings → Environment Variables** → Add:
   - Name: `KTV_PERFORMER_KEY`
   - Value: paste the random string
   - Environments: Production + Preview (Vercel blocks "sensitive" vars
     from Development by design — that's fine; we don't use Vercel's
     Development env locally)
3. Save.

### 3. Redeploy

Vercel project → Deployments → latest → ⋯ → **Redeploy**, *un-check*
"Use existing build cache" (env vars changed).

After ~1 minute, `/api/ktv/state` should return real JSON instead of
`503 kv_unavailable`.

### Local dev

The dev server (`npm run dev`) runs without KV by default and
gracefully shows the "Service warming up" empty state. To run with a
real KV against your Upstash instance, copy the env vars into
`puddings-world/.env.local`:

```
KV_REST_API_URL=https://<your-instance>.upstash.io
KV_REST_API_TOKEN=<your-token>
KTV_PERFORMER_KEY=<your-32-char-key>
```

`.env.local` is gitignored.

## Performer app integration (handoff)

The performer iOS / Android app needs to do these things:

1. **Open of gig:** clear the queue + open it.
   - `DELETE /api/ktv/queue` (auth)
   - `PATCH /api/ktv/state { acceptingRequests: true, nowPlayingId: null }` (auth)
2. **Display QR:** print or show a QR for
   `https://puddings-world.com/playground/street-ktv-menu` (no query
   params needed in v0).
3. **Poll the queue every ~3 s:** `GET /api/ktv/queue` (auth).
4. **When starting a song:** `PATCH /api/ktv/state { nowPlayingId: <id> }`
   (auth), then play audio locally / through whatever speaker is hooked up.
5. **When a song finishes / is skipped:**
   `DELETE /api/ktv/queue/<id>` (auth) and
   `PATCH /api/ktv/state { nowPlayingId: <next?.id or null> }`.
6. **Pause taking new requests** (e.g. between sets):
   `PATCH /api/ktv/state { acceptingRequests: false }`.
7. **End of gig:** as step 1, plus
   `PATCH /api/ktv/state { acceptingRequests: false, nowPlayingId: null }`.

Auth is a single shared bearer token (`KTV_PERFORMER_KEY`) baked into
the app's settings. It must never leave the app's local storage.

## End-to-end manual test

Run a full happy-path before relying on the system in front of an
actual audience.

```
□ 1. Performer app: clear queue + open queue (DELETE + PATCH).
□ 2. Audience phone: open the live URL, see catalog + empty queue.
□ 3. Tap a song → confirm sheet → confirm. See ✓ and queue position.
□ 4. Tap the same song again → blocked with 'already queued'.
□ 5. Tap a different song within 30s → blocked with rate-limit message.
□ 6. Performer app: poll picks up the new request.
□ 7. Performer app: 'now playing' (PATCH state) → audience web shows it.
□ 8. Performer app: finish (DELETE item + PATCH next) → audience web
       sees queue advance + Now Playing change.
□ 9. Performer app: close queue (PATCH acceptingRequests:false) →
       audience can no longer submit, sees the closed banner.
```

## Roadmap (deferred)

- **Realtime push** instead of polling (Server-Sent Events on the
  state endpoint).
- **Multi-performer / multi-session** — current spec is single-tenant.
- **Tip integration** — Stripe Payment Element in the confirmation
  flow.
- **Catalog admin UI** — for now, edit `ktv-catalog.ts` and push.
- **Public stats** — most-requested songs, gigs played count, surfaced
  on the home page.

See the cross-team spec (`~/Desktop/StreetPerformerMaster/audience_web/CLAUDE.md`)
for the full out-of-scope list and rev history.
