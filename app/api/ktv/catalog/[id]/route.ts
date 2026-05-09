import { revalidateTag } from "next/cache";
import { isAuthorized } from "@/lib/ktv/auth";
import { deleteSong } from "@/lib/ktv/catalog";
import { getRedis } from "@/lib/ktv/kv";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/ktv/catalog/:id — bearer-protected. Removes one song from
 * the catalog. Does NOT cascade into ktv:queue: rows that referenced this
 * id stay in the queue; the audience just won't be able to pick the song
 * again. App-side decides whether to also clean those queue rows.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!getRedis()) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  const { id } = await params;
  const removed = await deleteSong(id);
  if (!removed) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  revalidateTag("ktv-catalog");
  return new Response(null, { status: 204 });
}
