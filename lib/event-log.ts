import { getRedis } from "@/lib/ktv/kv";

export const EVENT_LOG_KEY = "log:events";
const EVENT_LOG_CAP = 1000;

export type LoggedEvent = {
  type: string;
  detail?: string;
  at: string;
};

/** Appends to the admin activity log. Never throws: logging is best-effort. */
export async function logEvent(type: string, detail?: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const event: LoggedEvent = { type, ...(detail ? { detail: detail.slice(0, 200) } : {}), at: new Date().toISOString() };
  try {
    await redis.lpush(EVENT_LOG_KEY, JSON.stringify(event));
    await redis.ltrim(EVENT_LOG_KEY, 0, EVENT_LOG_CAP - 1);
  } catch (err) {
    console.error("event-log:", err);
  }
}

/** Redis list entries come back as JSON strings or, auto-parsed, as objects. */
export function parseStored<T>(entries: unknown[]): T[] {
  const out: T[] = [];
  for (const e of entries) {
    if (e && typeof e === "object") out.push(e as T);
    else if (typeof e === "string") {
      try {
        out.push(JSON.parse(e) as T);
      } catch {
        // Skip entries that were never valid JSON.
      }
    }
  }
  return out;
}
