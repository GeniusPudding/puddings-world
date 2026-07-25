import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import type { ChatMessage } from "@/lib/ktv/types";

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
 * DELETE /api/ktv/messages/:id — removes one message.
 *
 * Two ways to authenticate (same shape as DELETE /api/ktv/queue/:id):
 *   - `Authorization: Bearer <KTV_PERFORMER_KEY>` — performer moderation
 *   - `X-Cancel-Token: <token>` — audience deleting their own message;
 *     must match the cancelToken returned at POST time for this id.
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
  const messages =
    (await redis.get<ChatMessage[]>(KV_KEYS.messages)) ?? [];
  const message = messages.find((m) => m.id === id);

  let authorized = isAuthorized(req);
  if (!authorized) {
    const token = req.headers.get("x-cancel-token");
    if (
      token &&
      message?.cancelToken &&
      timingSafeEq(token, message.cancelToken)
    ) {
      authorized = true;
    }
  }

  if (!authorized) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!message) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  await redis.set(
    KV_KEYS.messages,
    messages.filter((m) => m.id !== id),
  );
  return new Response(null, { status: 204 });
}
