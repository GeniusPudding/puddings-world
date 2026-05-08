import { catalog as seedCatalog } from "@/content/ktv-catalog";
import { getRedis, KV_KEYS } from "./kv";
import type { Song } from "./types";

/**
 * The performer app is the source of truth for the songbook: it owns the
 * processed accompaniment files and pushes the matching catalog up via
 * PUT /api/ktv/catalog. The static `content/ktv-catalog.ts` is kept as a
 * seed — used when KV is unset (local dev) or empty (first deploy, before
 * the app has synced anything).
 */
export async function loadCatalog(): Promise<Song[]> {
  const redis = getRedis();
  if (!redis) return seedCatalog;
  const stored = await redis.get<Song[]>(KV_KEYS.catalog);
  if (!stored || stored.length === 0) return seedCatalog;
  return stored;
}

export async function saveCatalog(songs: Song[]): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("kv_unavailable");
  await redis.set(KV_KEYS.catalog, songs);
}
