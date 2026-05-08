import { Redis } from "@upstash/redis";

/**
 * Lazy Upstash Redis client. Only instantiated on first use so build-time
 * (no env vars) doesn't crash the page.
 *
 * Required env vars (Vercel auto-injects when you connect Upstash via the
 * Storage marketplace):
 *   - KV_REST_API_URL    (or UPSTASH_REDIS_REST_URL)
 *   - KV_REST_API_TOKEN  (or UPSTASH_REDIS_REST_TOKEN)
 */
let _client: Redis | null = null;

export function getRedis(): Redis | null {
  if (_client) return _client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _client = new Redis({ url, token });
  return _client;
}

export const KV_KEYS = {
  queue: "ktv:queue",
  state: "ktv:state",
  catalog: "ktv:catalog",
  rateLimit: (ipHash: string) => `ktv:rl:${ipHash}`,
} as const;

export const RATE_LIMIT_WINDOW_SECONDS = 30;

/** Returns true if KV is configured and ready. Use to gate API responses. */
export function kvAvailable(): boolean {
  return getRedis() !== null;
}
