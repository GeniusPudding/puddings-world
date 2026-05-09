# Street KTV — audience web

Live at: <https://puddings-world.com/playground/street-ktv-menu>

The audience-facing surface for street-KTV gigs. Listeners scan a QR
code on a sign, browse the songbook, and tap to add a song to the live
queue. The performer's iOS / Android app reads the same queue from
Vercel KV and plays songs from there. The performer app also writes
back which song is currently playing, so the web shows that live too.

The performer app itself lives in a separate repo
(`~/Desktop/StreetPerformerMaster/`); only the audience web is here.

## Single source of truth for the cross-end contract

> **The HTTP contract, error-code catalog, and catalog-id alignment rules
> across web + iOS + Android are defined in
> `~/Desktop/StreetPerformerMaster/app/CLAUDE.md` §1.5.**
>
> If anything in this README disagrees with that file, that file wins —
> open a PR there to evolve the contract, then sync this side. The
> sister handoff doc `~/Desktop/StreetPerformerMaster/docs/HANDOFF_TO_PUDDINGS_WORLD.md`
> covers the puddings-world-internal details (KV schema, wireframes)
> and is intended to be retired into this README once stable.

## Where the things live

| Thing | File / location | Edited by |
|---|---|---|
| **Songbook** (catalog) — live | Vercel KV, key `ktv:catalog` | Performer app via `POST` / `DELETE` / `PUT` `/api/ktv/catalog`; one-shot seed via `tools/push_catalog_to_server.py` |
| **Songbook** — seed / fallback | [`content/ktv-catalog.ts`](../../../content/ktv-catalog.ts) | You, only when seeding a fresh deploy |
| Audience UI | [`page.tsx`](./page.tsx) + [`_components/KtvMenu.tsx`](./_components/KtvMenu.tsx) | Engineering |
| API route handlers | [`app/api/ktv/`](../../api/ktv/) | Engineering |
| Backend lib (KV / auth / rate-limit / types / catalog loader) | [`lib/ktv/`](../../../lib/ktv/) | Engineering |
| Queue + state | Vercel KV, keys `ktv:queue` and `ktv:state` | Both audience POST and performer app |
| Spec doc (cross-end contract) | `~/Desktop/StreetPerformerMaster/app/CLAUDE.md` §1.5 | Cross-team |

### Editing the songbook (live, post-deploy)

Catalog is fully KV-backed and shared between the audience web and the
performer app. The performer app is the only writer; the audience web
is read-only.

Three ways the catalog gets mutated:

- `POST /api/ktv/catalog` — performer adds or edits one song from inside
  the app's songbook tab (upsert by id).
- `DELETE /api/ktv/catalog/:id` — performer removes a song from inside
  the app.
- `PUT /api/ktv/catalog` — one-shot bulk seed / reset; called by the
  performer's `tools/push_catalog_to_server.py` (in the StreetPerformer
  repo) at first deploy or when restoring a known-good baseline.

Every mutation calls `revalidateTag('ktv-catalog')`, so the audience
page reflects changes within ~1 s.

You should not need to touch this repo to add or remove songs.

### Editing the seed / fallback (rare)

`content/ktv-catalog.ts` is only consulted when KV is unset (local dev
without `KV_REST_API_URL`) or empty (a fresh production deploy before the
app has synced). Once the app has done at least one PUT, the seed becomes
irrelevant in production.

Schema for both the live PUT body and the seed file:

```ts
{
  id: 'moon-tells-my-heart',  // stable lowercase kebab-case slug
  title: '月亮代表我的心',
  artist: '鄧麗君',
  language: 'zh',             // 'zh' | 'en' | 'jp' | 'ko' | 'other'
  key: 'C',                   // optional — performer key (e.g. 'C', 'Capo 3')
  durationSec: 220,           // optional
  tags: ['ballad'],           // optional, freeform
}
```

**Don't rename an existing `id` mid-gig** — pending queue items reference
it by id and will orphan if the slug disappears.

## Tech stack

- **Next.js 15** App Router. `page.tsx` is a server component that
  loads the songbook from Vercel KV (with a 30 s ISR cache, tagged
  `ktv-catalog` so PUTs invalidate immediately) and hands it to a
  client component.
- **Vercel KV (Upstash Redis)** as the cross-platform shared store.
  Three keys total: `ktv:queue` (JSON array of QueueItem),
  `ktv:state` (JSON object: `acceptingRequests`, `nowPlayingId`,
  `updatedAt`), and `ktv:catalog` (JSON array of Song).
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
   GET  /api/ktv/catalog ◄─────── ktv:catalog ◄──────────►  GET  /api/ktv/catalog
   (server component, ISR 30s,                                (on launch, cache locally)
    revalidated on writes)                                  POST /api/ktv/catalog
                                                              (upsert one — bearer)
                                                            DELETE /api/ktv/catalog/:id
                                                              (remove one — bearer)
                                                            PUT /api/ktv/catalog
                                                              (bulk seed/reset — bearer)

   GET  /api/ktv/state ─────────► ktv:state ─────────────►  PATCH /api/ktv/state
        (poll every 5s,                                       (set nowPlayingId,
         public)                                               flip acceptingRequests)

   POST /api/ktv/queue ─────────► ktv:queue ─────────────►  GET  /api/ktv/queue
        (anonymous,                                           (poll every 3s,
         rate-limited;                                         bearer auth)
         returns cancelToken)                               DELETE /api/ktv/queue/:id
   DELETE /api/ktv/queue/:id                                  (after singing it)
        (X-Cancel-Token,                                    DELETE /api/ktv/queue
         audience self-cancel)                                (clear all between gigs)
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

### Playback mode (manual)

The performer app does **not auto-play** the next song. Each request is
just a notification — the performer taps "Play" on the app panel to
start. This keeps creative control with the performer (skip songs they
don't feel like, stretch breaks, etc.) and avoids the awkwardness of
audio kicking off before the performer is ready.

So the typical app flow is:

```
queue receives new item
  → app shows in-app notification + maybe sound
  → performer taps the item to start
    → PATCH /api/ktv/state { nowPlayingId: <id> }
    → app starts audio playback locally
  → song ends (or performer taps 'next' / 'skip')
    → DELETE /api/ktv/queue/<id>
    → PATCH /api/ktv/state { nowPlayingId: <next.id or null> }
```

### Audio output (performer app's job, not web's)

Where the audio actually comes out — phone speaker, Bluetooth speaker,
aux to amplifier, etc. — is decided by the performer app and its
device. The web has no opinion and no involvement.

## API contract

All endpoints under `/api/ktv/`. All return JSON unless noted.

### `GET /api/ktv/catalog` — public

Returns the live songbook as a raw `CatalogSong[]` array (matches the
cross-end spec in `StreetPerformerMaster/app/CLAUDE.md §1.5.3`).
Edge-cached for 60 s (`Cache-Control: public, s-maxage=60,
stale-while-revalidate=120`); every catalog mutation calls
`revalidateTag('ktv-catalog')` to publish within ~1 s.

```json
[
  { "id": "moon-tells-my-heart", "title": "月亮代表我的心", "artist": "鄧麗君",
    "language": "zh", "key": "C", "durationSec": 220, "tags": ["ballad", "classic"] }
]
```

If KV is unset or empty, falls back to `content/ktv-catalog.ts`.

### `POST /api/ktv/catalog` — performer-only

Upsert one song by id (insert or replace). For runtime catalog edits
from the performer app's songbook tab.

```http
POST /api/ktv/catalog
Authorization: Bearer <KTV_PERFORMER_KEY>
Content-Type: application/json

{ "id": "moon-tells-my-heart", "title": "月亮代表我的心", "artist": "鄧麗君", "language": "zh", ... }
```

- 200 — returns the upserted Song row
- 400 `bad_request` with `message` — validation failed
- 401 `unauthorized` — missing / wrong bearer
- 503 `kv_unavailable`

### `DELETE /api/ktv/catalog/:id` — performer-only

Removes one song from the catalog. **Does not cascade** into
`ktv:queue` — rows in the live queue that reference this id stay there.
The performer app decides whether to clean those up too.

- 204 — removed
- 404 `not_found` — id wasn't in the catalog
- 401 `unauthorized`
- 503 `kv_unavailable`

### `PUT /api/ktv/catalog` — performer-only

Idempotent replace of the entire songbook. Used by the performer's
`tools/push_catalog_to_server.py` for bulk seed / reset.

```http
PUT /api/ktv/catalog
Authorization: Bearer <KTV_PERFORMER_KEY>
Content-Type: application/json

[ { "id": "...", "title": "...", "artist": "...", "language": "zh", ... }, ... ]
```

Body is a raw `CatalogSong[]` array per the spec; a `{ songs: [...] }`
wrapper is also accepted for ergonomic backwards compat.

- 200 — returns the upserted `CatalogSong[]`
- 400 `bad_request` with `message` — validation failed (see below)
- 401 `unauthorized`
- 503 `kv_unavailable`

Validation rules (apply to both `POST` body and each item under `PUT.songs`):

- `id`: required, must match `/^[a-z0-9][a-z0-9-]{0,63}$/`; unique within
  a `PUT` payload
- `title`, `artist`: required non-empty strings
- `language`: required, one of `zh | en | jp | ko | other`
- `key`, `durationSec`, `tags`, `keyOffset`, `genderVariant`, `category`:
  optional, lightly validated; unknown fields are silently dropped
- `PUT` cap: 5000 songs per payload

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

Returns `204 No Content` on success.

### `POST /api/ktv/queue` — public (with optional bearer)

Submit a song request.

```http
POST /api/ktv/queue
Content-Type: application/json

{ "songId": "moon-tells-my-heart" }
```

- 200 `{ id, cancelToken, position, queueLength }` — added. The audience
  client persists `(id, cancelToken)` in localStorage and uses it later
  to delete its own row without bearer auth.
- 403 `not_accepting` — performer closed the queue
- 404 `unknown_song` — songId not in catalog
- 409 `duplicate` — that song already in queue (returns its position)
- 429 `rate_limit` — same IP submitted within the last 30 seconds
- 503 `kv_unavailable` — backend not provisioned (see Setup below)

**Bearer bypass for performer self-add**: when the request carries
`Authorization: Bearer <KTV_PERFORMER_KEY>`, the rate-limit, duplicate,
and `not_accepting` checks are skipped. This unblocks the
performer-app flow where the performer adds their own pick to the
queue from inside their app (resolves the open gap noted in
`app/CLAUDE.md §1.5.10`). The `unknown_song` and `bad_request` checks
still apply.

The body also accepts optional `requesterName` and `message` (≤ 30 /
≤ 200 chars), but the audience UI no longer sends them. They're kept
in the contract for future re-enable.

### `GET /api/ktv/queue` — performer-only

Full queue with joined catalog info (and internal fields for the
performer's own UI). Anonymous callers should use `GET /api/ktv/state`
instead.

### `DELETE /api/ktv/queue` — performer-only

Empties the queue. Call this between gigs to start clean.

### `DELETE /api/ktv/queue/:id` — performer or self-cancel

Removes one queue row. Two ways to authenticate:

- `Authorization: Bearer <KTV_PERFORMER_KEY>` — performer (can delete any row)
- `X-Cancel-Token: <token>` — audience self-cancel; the token must match
  the `cancelToken` returned at POST time for this exact id

Returns 204 on success, 401 if neither auth path is satisfied, 404 if
the row no longer exists.

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

The performer iOS / Android app needs to do these things. The
authoritative version (with iOS-/Android-specific code snippets) is
`StreetPerformerMaster/app/CLAUDE.md §1.5.5`; the summary below is
just an index for the web-side reader.

1. **Open of gig:** clear the queue + open it.
   - `DELETE /api/ktv/queue` (auth)
   - `PATCH /api/ktv/state { acceptingRequests: true, nowPlayingId: null }` (auth)
2. **Display QR:** print or show a QR for
   `https://puddings-world.com/playground/street-ktv-menu/` (note
   trailing slash). No query params needed in v0.
3. **Poll the queue every ~3 s** in foreground, **30 s** in background:
   `GET /api/ktv/queue` (auth). On a delta vs the previous poll, fire
   an in-app notification (toast, sound, vibration) so the performer
   notices a new request without staring at the screen.
4. **Manual playback:** the performer taps an item to play. App calls
   `PATCH /api/ktv/state { nowPlayingId: <id> }` (auth), then starts
   audio playback locally / through whatever speaker is hooked up.
   **Do not auto-play** — see "Playback mode" above.
5. **Performer self-add** (performer adding their own pick from the
   in-app songbook): `POST /api/ktv/queue { songId }` **with the
   bearer header**. Bearer-presence skips audience-only checks
   (rate-limit, duplicate, not_accepting), so the same endpoint
   handles both audience and performer paths.
6. **When a song finishes / is skipped:**
   `DELETE /api/ktv/queue/<id>` (auth) and
   `PATCH /api/ktv/state { nowPlayingId: <next?.id or null> }`.
7. **Pause taking new requests** (e.g. between sets):
   `PATCH /api/ktv/state { acceptingRequests: false }`.
8. **End of gig:** as step 1, plus
   `PATCH /api/ktv/state { acceptingRequests: false, nowPlayingId: null }`.

Auth is a single shared bearer token (`KTV_PERFORMER_KEY`) baked into
the app's settings (iOS `Resources/Config.xcconfig` → Info.plist;
Android `local.properties` → BuildConfig). It must never leave the
app's local storage.

### App-side load discipline

- 3 s polling is fine for a single app. **Do not** poll faster than 1 s.
- If the app is backgrounded (gig paused, performer switching apps),
  pause polling. Resume on foreground. Same idea as the audience web's
  Page Visibility API.
- Do not GET state and queue separately when both are needed — the
  performer-only `GET /api/ktv/queue` already returns enriched queue
  with joined catalog info; pair it with one `GET /api/ktv/state`
  (cached) only when you also need `nowPlayingId` confirmation.

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

## Backend load model

Naive polling at audience scale will burn through Upstash free tier
fast (500k commands / month, 10k / day). The current design keeps load
down with three layers:

1. **Edge cache on `GET /api/ktv/state`**:
   `Cache-Control: public, s-maxage=2, stale-while-revalidate=4`.
   Vercel's CDN caches the response for 2 s. Within that window, every
   audience phone hitting `/state` is served from the edge — only the
   first request after each 2 s window touches Redis. Multiplier
   collapses regardless of audience size.

2. **`redis.mget`** for the state + queue read. Counts as a single
   Upstash command instead of two `.get()` calls.

3. **Page Visibility API** in the audience client. When the tab is
   hidden (phone locked, switched to another app, etc.), polling pauses;
   it resumes when the tab is visible again. A backgrounded phone is
   contributing zero load.

### Worst-case math

A 2-hour gig with 50 simultaneous audience members polling every 5 s,
all foregrounded, all hitting the same Vercel edge node:

| Naive (no edge cache) | Optimized |
|---|---|
| 50 phones × 1440 polls × 2 KV ops = **144 000 ops** | edge serves cache; origin hits ≈ 30 / min × 120 min = 3600 origin requests × 1 op (mget) = **3600 ops** |

That's ~40× reduction. Free tier daily limit (10 000) covers a couple
gigs / day.

The performer app's `GET /api/ktv/queue` polling (one client, every 3 s)
adds ~2400 ops per gig and is left uncached so the performer sees fresh
state quickly.

### What to watch in production

- Upstash dashboard → **Usage** → daily commands. If close to 8000+,
  raise `s-maxage` (e.g. to 3 s) or increase `POLL_INTERVAL_MS` (e.g.
  to 7 s).
- Vercel dashboard → **Analytics → Function invocations** for
  `/api/ktv/state`. Should be much lower than client poll count
  thanks to the cache.

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
