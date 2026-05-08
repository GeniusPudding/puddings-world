import { nanoid } from "nanoid";
import { catalog } from "@/content/ktv-catalog";
import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import {
  checkAndStampRateLimit,
  clientIp,
  hashIp,
} from "@/lib/ktv/rate-limit";
import type { QueueItem, State } from "@/lib/ktv/types";

export const dynamic = "force-dynamic";

const MAX_NAME_LEN = 30;
const MAX_MESSAGE_LEN = 200;

/** GET /api/ktv/queue — performer-only, returns full queue with metadata. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  const queue = (await redis.get<QueueItem[]>(KV_KEYS.queue)) ?? [];
  // Strip ipHash (internal) and join catalog info for convenience
  const enriched = queue.map(({ ipHash: _ipHash, ...item }) => {
    const song = catalog.find((c) => c.id === item.songId);
    return {
      ...item,
      song: song
        ? {
            title: song.title,
            artist: song.artist,
            language: song.language,
            durationSec: song.durationSec,
          }
        : null,
    };
  });
  return Response.json(enriched);
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

  const ipHash = hashIp(clientIp(req));
  if (!isPerformer) {
    const allowed = await checkAndStampRateLimit(ipHash);
    if (!allowed) {
      return Response.json({ error: "rate_limit" }, { status: 429 });
    }
  }

  let body: { songId?: string; requesterName?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (!body.songId || typeof body.songId !== "string") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const song = catalog.find((c) => c.id === body.songId);
  if (!song) {
    return Response.json({ error: "unknown_song" }, { status: 404 });
  }

  if (!isPerformer) {
    const state = await redis.get<State>(KV_KEYS.state);
    if (state && !state.acceptingRequests) {
      return Response.json({ error: "not_accepting" }, { status: 403 });
    }
  }

  const queue = (await redis.get<QueueItem[]>(KV_KEYS.queue)) ?? [];
  if (!isPerformer) {
    const existing = queue.find((q) => q.songId === body.songId);
    if (existing) {
      const position = queue.indexOf(existing) + 1;
      return Response.json(
        { error: "duplicate", position, queueLength: queue.length },
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
  };

  const next = [...queue, item];
  await redis.set(KV_KEYS.queue, next);

  return Response.json({
    id: item.id,
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
