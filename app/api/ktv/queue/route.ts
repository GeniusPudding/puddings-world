import { nanoid } from "nanoid";
import { catalog as seedCatalog } from "@/content/ktv-catalog";
import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import {
  checkAndStampRateLimit,
  clientIp,
  hashIp,
} from "@/lib/ktv/rate-limit";
import type { QueueItem, Song, State } from "@/lib/ktv/types";

export const dynamic = "force-dynamic";

const MAX_NAME_LEN = 30;
const MAX_MESSAGE_LEN = 200;

/**
 * GET /api/ktv/queue — performer-only. Returns raw QueueItem[] per spec
 * (StreetPerformerMaster app/CLAUDE.md §1.5.3). Internal fields (ipHash,
 * cancelToken) are stripped; the app joins songId → title/artist itself
 * using its cached catalog (rev 3 §1.5.5).
 *
 * Strict deserializers (e.g. Kotlin kotlinx.serialization with default
 * ignoreUnknownKeys=false) would throw on extra fields, so this route
 * keeps the response surface tight to exactly what the spec lists.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  const queue = (await redis.get<QueueItem[]>(KV_KEYS.queue)) ?? [];
  const stripped = queue.map(
    ({ ipHash: _ipHash, cancelToken: _cancelToken, ...item }) => item,
  );
  return Response.json(stripped, { headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/ktv/queue — submit a song request.
 *
 * Public by default (anonymous audience). When a valid bearer token is
 * present, treats the caller as the performer and skips audience-only
 * checks (rate-limit, duplicate, not_accepting). This unblocks the
 * performer self-add flow described in `app/CLAUDE.md §1.5.10`.
 */
export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }

  const isPerformer = isAuthorized(req);

  // Parse + validate the body before touching the rate limiter so an
  // accidental bad JSON from a real audience phone doesn't burn their
  // 30-second slot.
  let body: { songId?: string; requesterName?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.songId || typeof body.songId !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(req));
  if (!isPerformer) {
    const allowed = await checkAndStampRateLimit(ipHash);
    if (!allowed) {
      return Response.json({ error: "rate_limit" }, { status: 429 });
    }
  }

  // One round-trip for state + queue + catalog instead of three separate gets.
  const [state, queue, storedCatalog] = await redis.mget<
    [State | null, QueueItem[] | null, Song[] | null]
  >(KV_KEYS.state, KV_KEYS.queue, KV_KEYS.catalog);
  const cat =
    storedCatalog && storedCatalog.length > 0 ? storedCatalog : seedCatalog;
  const q = queue ?? [];

  const song = cat.find((c) => c.id === body.songId);
  if (!song) {
    return Response.json({ error: "unknown_song" }, { status: 404 });
  }

  if (!isPerformer) {
    if (state && !state.acceptingRequests) {
      return Response.json({ error: "not_accepting" }, { status: 403 });
    }
    const existing = q.find((qi) => qi.songId === body.songId);
    if (existing) {
      const position = q.indexOf(existing) + 1;
      return Response.json(
        { error: "duplicate", position, queueLength: q.length },
        { status: 409 },
      );
    }
  }

  const item: QueueItem = {
    id: nanoid(10),
    songId: body.songId,
    requesterName:
      typeof body.requesterName === "string"
        ? body.requesterName.slice(0, MAX_NAME_LEN).trim() || undefined
        : undefined,
    message:
      typeof body.message === "string"
        ? body.message.slice(0, MAX_MESSAGE_LEN).trim() || undefined
        : undefined,
    addedAt: new Date().toISOString(),
    ipHash,
    // Audience uses this to DELETE their own row without bearer auth.
    // Performer-added rows get one too for uniformity (the app already has
    // bearer access, so it can ignore the field).
    cancelToken: nanoid(16),
  };

  const next = [...q, item];
  await redis.set(KV_KEYS.queue, next);

  return Response.json({
    id: item.id,
    cancelToken: item.cancelToken,
    position: next.length,
    queueLength: next.length,
  });
}

/** DELETE /api/ktv/queue — performer-only, clears the entire queue. */
export async function DELETE(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  await redis.set(KV_KEYS.queue, []);
  return new Response(null, { status: 204 });
}
