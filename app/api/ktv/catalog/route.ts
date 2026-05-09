import { revalidateTag } from "next/cache";
import { isAuthorized } from "@/lib/ktv/auth";
import { loadCatalog, saveCatalog, upsertSong } from "@/lib/ktv/catalog";
import { getRedis } from "@/lib/ktv/kv";
import type { Song, SongLanguage } from "@/lib/ktv/types";

// Catalog only changes when the performer edits it (in-app or via the
// `tools/push_catalog_to_server.py` seed script). Edge-cache aggressively;
// every mutation calls revalidateTag to bust the audience page's ISR
// cache so updates appear within ~1 s without waiting for s-maxage.
const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
};

/**
 * GET /api/ktv/catalog — public. Returns the live songbook as a raw
 * `CatalogSong[]` array per the spec (StreetPerformerMaster
 * app/CLAUDE.md §1.5.3).
 */
export async function GET() {
  const songs = await loadCatalog();
  return Response.json(songs, { headers: PUBLIC_CACHE_HEADERS });
}

const VALID_LANGS = new Set<SongLanguage>(["zh", "en", "jp", "ko", "other"]);
const VALID_GENDERS = new Set(["female", "male"]);
const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_SONGS = 5000;

type SongResult = { ok: true; song: Song } | { ok: false; reason: string };

function validateSong(raw: unknown, hint: string): SongResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: `${hint} is not an object` };
  }
  const s = raw as Record<string, unknown>;
  if (typeof s.id !== "string" || !ID_RE.test(s.id)) {
    return {
      ok: false,
      reason: `${hint}.id must be lowercase kebab-case slug`,
    };
  }
  if (typeof s.title !== "string" || !s.title.trim()) {
    return { ok: false, reason: `${hint}.title required` };
  }
  if (typeof s.artist !== "string" || !s.artist.trim()) {
    return { ok: false, reason: `${hint}.artist required` };
  }
  if (
    typeof s.language !== "string" ||
    !VALID_LANGS.has(s.language as SongLanguage)
  ) {
    return {
      ok: false,
      reason: `${hint}.language must be one of zh|en|jp|ko|other`,
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
  if (typeof s.keyOffset === "number" && Number.isFinite(s.keyOffset)) {
    song.keyOffset = Math.trunc(s.keyOffset);
  }
  if (s.genderVariant === null) {
    song.genderVariant = null;
  } else if (
    typeof s.genderVariant === "string" &&
    VALID_GENDERS.has(s.genderVariant)
  ) {
    song.genderVariant = s.genderVariant as "female" | "male";
  }
  if (typeof s.category === "string" && s.category.trim()) {
    song.category = s.category.trim();
  }
  return { ok: true, song };
}

type ListResult =
  | { ok: true; songs: Song[] }
  | { ok: false; reason: string };

function validateList(input: unknown): ListResult {
  // Spec body shape is a raw `CatalogSong[]` array (see §1.5.3). For
  // ergonomics we also accept a `{ songs: [...] }` wrapper so a hand-
  // crafted curl that nested by accident still works.
  let raw: unknown;
  if (Array.isArray(input)) {
    raw = input;
  } else if (input && typeof input === "object") {
    raw = (input as { songs?: unknown }).songs;
  } else {
    raw = null;
  }
  if (!Array.isArray(raw)) {
    return { ok: false, reason: "expected CatalogSong[] (or { songs: [...] })" };
  }
  if (raw.length > MAX_SONGS) {
    return { ok: false, reason: `too many songs (max ${MAX_SONGS})` };
  }
  const seen = new Set<string>();
  const out: Song[] = [];
  for (let i = 0; i < raw.length; i++) {
    const r = validateSong(raw[i], `songs[${i}]`);
    if (!r.ok) return r;
    if (seen.has(r.song.id)) {
      return { ok: false, reason: `duplicate id "${r.song.id}"` };
    }
    seen.add(r.song.id);
    out.push(r.song);
  }
  return { ok: true, songs: out };
}

function ensureBearerAndKv(req: Request): Response | null {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!getRedis()) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  return null;
}

/**
 * POST /api/ktv/catalog — bearer-protected. Upsert a single song by id.
 *
 * Body is one CatalogSong object; `id` is required and the caller (app)
 * is expected to compute it via the same `slug_id` algorithm used by
 * `tools/catalog/slug.py`. Idempotent — same id reposted replaces the row.
 */
export async function POST(req: Request) {
  const gate = ensureBearerAndKv(req);
  if (gate) return gate;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const result = validateSong(body, "song");
  if (!result.ok) {
    return Response.json(
      { error: "bad_request", message: result.reason },
      { status: 400 },
    );
  }
  await upsertSong(result.song);
  revalidateTag("ktv-catalog");
  return Response.json(result.song, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * PUT /api/ktv/catalog — bearer-protected. Replace the entire songbook.
 *
 * Used by `tools/push_catalog_to_server.py` for one-shot seed / reset.
 * Idempotent replace; sender always sends the full list.
 */
export async function PUT(req: Request) {
  const gate = ensureBearerAndKv(req);
  if (gate) return gate;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const result = validateList(body);
  if (!result.ok) {
    return Response.json(
      { error: "bad_request", message: result.reason },
      { status: 400 },
    );
  }
  await saveCatalog(result.songs);
  revalidateTag("ktv-catalog");
  // Spec returns the written CatalogSong[] back to the caller.
  return Response.json(result.songs, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
