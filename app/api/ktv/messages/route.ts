import { nanoid } from "nanoid";
import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import {
  MAX_NICKNAME_LEN,
  MAX_TEXT_LEN,
  MESSAGE_COOLDOWN_SEC,
  MESSAGES_CAP,
  MESSAGES_TAIL,
  PERFORMER_DISPLAY_NAME,
  sanitizeMessageText,
  toPublicMessage,
} from "@/lib/ktv/messages";
import { clientIp, hashIp } from "@/lib/ktv/rate-limit";
import type { ChatMessage, State } from "@/lib/ktv/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/ktv/messages — public, incremental pull.
 *
 * `?since=<id>` returns only messages after that id (empty array when
 * nothing new — the performer app's steady-state cheap poll). Without
 * `since`, returns the trailing window (audience "load more" history).
 * An unknown `since` id (e.g. the row was deleted or trimmed) falls back
 * to the trailing window so the client can resync.
 *
 * `no-store`: the audience page reads its message tail from the cached
 * /state poll instead; the callers here (one performer app, occasional
 * history loads) want freshness, not fan-out protection.
 */
export async function GET(req: Request) {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  const messages =
    (await redis.get<ChatMessage[]>(KV_KEYS.messages)) ?? [];

  const since = new URL(req.url).searchParams.get("since");
  let window = messages;
  if (since) {
    const idx = messages.findIndex((m) => m.id === since);
    window = idx >= 0 ? messages.slice(idx + 1) : messages.slice(-MESSAGES_TAIL);
  } else {
    window = messages.slice(-MESSAGES_TAIL);
  }

  return Response.json(window.map(toPublicMessage), {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * POST /api/ktv/messages — post one message.
 *
 * Anonymous audience by default (role stamped `audience`, 3 s per-IP
 * cooldown, gated on state.acceptingMessages). With a valid bearer the
 * caller is the performer: role `performer`, fixed display name, all
 * audience-only checks bypassed. Client-supplied `role` is ignored.
 */
export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }

  const isPerformer = isAuthorized(req);

  let body: { text?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? sanitizeMessageText(body.text) : "";
  if (!text || text.length > MAX_TEXT_LEN) {
    return Response.json(
      { error: "bad_request", message: `text required, <= ${MAX_TEXT_LEN} chars` },
      { status: 400 },
    );
  }
  const rawName =
    typeof body.name === "string" ? sanitizeMessageText(body.name) : "";
  if (rawName.length > MAX_NICKNAME_LEN) {
    return Response.json(
      { error: "bad_request", message: `name <= ${MAX_NICKNAME_LEN} chars` },
      { status: 400 },
    );
  }

  const ipHash = hashIp(clientIp(req));

  if (!isPerformer) {
    const state = await redis.get<State>(KV_KEYS.state);
    if (state && state.acceptingMessages === false) {
      return Response.json({ error: "not_accepting" }, { status: 403 });
    }
    // Time-based cooldown: SET NX with TTL is one command and atomic —
    // if the key already exists the IP is still cooling down.
    const acquired = await redis.set(`ktv:msgrl:${ipHash}`, 1, {
      nx: true,
      ex: MESSAGE_COOLDOWN_SEC,
    });
    if (acquired === null) {
      return Response.json(
        { error: "rate_limit", cooldownSec: MESSAGE_COOLDOWN_SEC },
        { status: 429 },
      );
    }
  }

  const message: ChatMessage = {
    id: nanoid(10),
    role: isPerformer ? "performer" : "audience",
    name: isPerformer ? PERFORMER_DISPLAY_NAME : rawName || undefined,
    text,
    createdAt: new Date().toISOString(),
    ...(isPerformer ? {} : { ipHash }),
    // Uniform with the queue: performer rows get one too and ignore it.
    cancelToken: nanoid(16),
  };

  const messages =
    (await redis.get<ChatMessage[]>(KV_KEYS.messages)) ?? [];
  const next = [...messages, message].slice(-MESSAGES_CAP);
  await redis.set(KV_KEYS.messages, next);

  return Response.json({
    id: message.id,
    cancelToken: message.cancelToken,
    createdAt: message.createdAt,
  });
}

/** DELETE /api/ktv/messages — performer-only, clears the board (end of gig). */
export async function DELETE(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  await redis.set(KV_KEYS.messages, []);
  return new Response(null, { status: 204 });
}
