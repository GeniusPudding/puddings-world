import { createHash } from "node:crypto";
import { getRedis, KV_KEYS, RATE_LIMIT_WINDOW_SECONDS } from "./kv";

/**
 * SHA-256 of the IP, truncated to 16 hex chars. Stored in queue rows for
 * dedup attribution and used as the rate-limit key.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/** Pull the best-effort client IP from common Vercel / proxy headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Returns true if the IP hash is fresh (allowed to POST). Sets a 30-second
 * TTL key on success. Returns false if the key already exists.
 *
 * Atomic: uses Redis SET NX EX so concurrent POSTs from the same IP can't
 * both pass.
 */
export async function checkAndStampRateLimit(
  ipHash: string,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // No KV → don't gate. Service-level error handled elsewhere.
  const key = KV_KEYS.rateLimit(ipHash);
  const result = await redis.set(key, 1, {
    nx: true,
    ex: RATE_LIMIT_WINDOW_SECONDS,
  });
  return result === "OK";
}
