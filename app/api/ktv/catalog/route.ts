import { revalidateTag } from "next/cache";
import { isAuthorized } from "@/lib/ktv/auth";
import { loadCatalog, saveCatalog } from "@/lib/ktv/catalog";
import { getRedis } from "@/lib/ktv/kv";
import type { Song, SongLanguage } from "@/lib/ktv/types";

// Catalog only changes when the performer syncs new accompaniment files
// (minutes-to-days cadence, not per-second). Edge-cache aggressively;
// PUT calls revalidateTag to bust the page-level ISR immediately so a
// fresh sync shows up without waiting for s-maxage to expire.
const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

/** GET /api/ktv/catalog — public. Returns the live songbook. */
export async function GET() {
  const songs = await loadCatalog();
  return Response.json({ songs }, { headers: PUBLIC_CACHE_HEADERS });
}

const VALID_LANGS = new Set<SongLanguage>(["zh", "en", "jp", "ko", "other"]);
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_SONGS = 5000;

type ValidationResult =
  | { ok: true; songs: Song[] }
  | { ok: false; reason: string };

function validate(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { ok: false, reason: "body must be an object" };
  }
  const raw = (input as { songs?: unknown }).songs;
  if (!Array.isArray(raw)) {
    return { ok: false, reason: "expected { songs: Song[] }" };
  }
  if (raw.length > MAX_SONGS) {
    return { ok: false, reason: `too many songs (max ${MAX_SONGS})` };
  }

  const seen = new Set<string>();
  const out: Song[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    if (!r || typeof r !== "object") {
      return { ok: false, reason: `songs[${i}] is not an object` };
    }
    const s = r as Record<string, unknown>;
    if (typeof s.id !== "string" || !ID_RE.test(s.id)) {
      return {
        ok: false,
        reason: `songs[${i}].id must be lowercase kebab-case slug`,
      };
    }
    if (seen.has(s.id)) {
      return { ok: false, reason: `duplicate id "${s.id}"` };
    }
    seen.add(s.id);
    if (typeof s.title !== "string" || !s.title.trim()) {
      return { ok: false, reason: `songs[${i}].title required` };
    }
    if (typeof s.artist !== "string" || !s.artist.trim()) {
      return { ok: false, reason: `songs[${i}].artist required` };
    }
    if (
      typeof s.language !== "string" ||
      !VALID_LANGS.has(s.language as SongLanguage)
    ) {
      return {
        ok: false,
        reason: `songs[${i}].language must be one of zh|en|jp|ko|other`,
      };
    }

    const song: Song = {
      id: s.id,
      title: s.title.trim(),
      artist: s.artist.trim(),
      language: s.language as SongLanguage,
    };
    if (typeof s.key === "string" && s.key.trim()) {
      song.key = s.key.trim();
    }
    if (
      typeof s.durationSec === "number" &&
      Number.isFinite(s.durationSec) &&
      s.durationSec > 0
    ) {
      song.durationSec = Math.floor(s.durationSec);
    }
    if (Array.isArray(s.tags)) {
      const tags = s.tags
        .filter(
          (t): t is string => typeof t === "string" && t.trim().length > 0,
        )
        .map((t) => t.trim());
      if (tags.length > 0) song.tags = tags;
    }
    out.push(song);
  }
  return { ok: true, songs: out };
}

/**
 * PUT /api/ktv/catalog — performer-only. Replaces the entire songbook.
 *
 * The performer app is the writer; this endpoint accepts the full list
 * (idempotent replace) so the app's repertoire.json stays the single
 * source of truth and we don't have to reconcile partial deltas.
 */
export async function PUT(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!getRedis()) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const result = validate(body);
  if (!result.ok) {
    return Response.json(
      { error: "bad_request", message: result.reason },
      { status: 400 },
    );
  }
  await saveCatalog(result.songs);
  revalidateTag("ktv-catalog");
  return Response.json(
    { count: result.songs.length },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
