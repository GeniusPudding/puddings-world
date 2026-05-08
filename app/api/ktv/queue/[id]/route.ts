import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import type { QueueItem } from "@/lib/ktv/types";

export const dynamic = "force-dynamic";

/** DELETE /api/ktv/queue/:id — performer-only, removes one item (e.g. after singing it). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  const { id } = await params;
  const queue = (await redis.get<QueueItem[]>(KV_KEYS.queue)) ?? [];
  const next = queue.filter((q) => q.id !== id);
  if (next.length === queue.length) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  await redis.set(KV_KEYS.queue, next);
  return new Response(null, { status: 204 });
}
