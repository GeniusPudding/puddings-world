import { catalog as seedCatalog } from "@/content/ktv-catalog";
import { getRedis, KV_KEYS } from "./kv";
import type { Song } from "./types";

/**
 * Catalog lives in Vercel KV (`ktv:catalog`) and is the single source of
 * truth shared across the audience web and the performer apps. Writers
 * are bearer-protected (POST / DELETE / PUT on `/api/ktv/catalog`); the
 * audience web is read-only.
 *
 * The static `content/ktv-catalog.ts` is kept as a seed for local dev
 * and first-deploy bootstrap (when KV is unset or empty). Once the
 * performer's `tools/push_catalog_to_server.py` (or any in-app POST) has
 * written to KV, the seed is no longer consulted in production.
 */
export async function loadCatalog(): Promise<Song[]> {
  const redis = getRedis();
  if (!redis) return seedCatalog;
  const stored = await redis.get<Song[]>(KV_KEYS.catalog);
  if (!stored || stored.length === 0) return seedCatalog;
  return stored;
}

/** Replace the entire catalog (PUT path). */
export async function saveCatalog(songs: Song[]): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("kv_unavailable");
  await redis.set(KV_KEYS.catalog, songs);
}

/**
 * Insert or replace one song by id. Falls back to a 1-row catalog if KV
 * was empty (caller should usually `push_catalog_to_server.py` seed first).
 */
export async function upsertSong(song: Song): Promise<Song[]> {
  const redis = getRedis();
  if (!redis) throw new Error("kv_unavailable");
  const current = (await redis.get<Song[]>(KV_KEYS.catalog)) ?? [];
  const idx = current.findIndex((s) => s.id === song.id);
  const next =
    idx >= 0
      ? current.map((s, i) => (i === idx ? song : s))
      : [...current, song];
  await redis.set(KV_KEYS.catalog, next);
  return next;
}

/** Returns true if a row was actually removed; false if the id wasn't there. */
export async function deleteSong(id: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) throw new Error("kv_unavailable");
  const current = (await redis.get<Song[]>(KV_KEYS.catalog)) ?? [];
  const next = current.filter((s) => s.id !== id);
  if (next.length === current.length) return false;
  await redis.set(KV_KEYS.catalog, next);
  return true;
}
