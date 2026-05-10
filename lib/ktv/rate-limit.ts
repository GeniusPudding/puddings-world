import { createHash } from "node:crypto";

/**
 * SHA-256 of the IP, truncated to 16 hex chars. Stored on each QueueItem
 * as `ipHash` so the per-IP "max N rows in queue" anti-spam quota in
 * `app/api/ktv/queue/route.ts` can recognise repeat submitters without
 * the server ever knowing the real IP.
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
