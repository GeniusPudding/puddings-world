import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import type { QueueItem } from "@/lib/ktv/types";

export const dynamic = "force-dynamic";

/** Constant-time string compare; defends against timing oracles on the token. */
function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * DELETE /api/ktv/queue/:id — removes one queue item.
 *
 * Two ways to authenticate:
 *   - `Authorization: Bearer <KTV_PERFORMER_KEY>` — performer (can delete anything)
 *   - `X-Cancel-Token: <token>` — audience self-cancel; the token must
 *     match the one returned at POST time for this exact id.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  const { id } = await params;
  const queue = (await redis.get<QueueItem[]>(KV_KEYS.queue)) ?? [];
  const item = queue.find((q) => q.id === id);

  // Performer bearer wins regardless of whether the row exists.
  let authorized = isAuthorized(req);

  // Audience self-cancel: token must match an existing row's cancelToken.
  if (!authorized) {
    const token = req.headers.get("x-cancel-token");
    if (
      token &&
      item?.cancelToken &&
      timingSafeEq(token, item.cancelToken)
    ) {
      authorized = true;
    }
  }

  if (!authorized) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!item) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const next = queue.filter((q) => q.id !== id);
  await redis.set(KV_KEYS.queue, next);
  return new Response(null, { status: 204 });
}
