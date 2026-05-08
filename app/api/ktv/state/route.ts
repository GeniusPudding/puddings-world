import { catalog } from "@/content/ktv-catalog";
import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import type { QueueItem, State, StatePublic } from "@/lib/ktv/types";

const DEFAULT_STATE: State = {
  acceptingRequests: true,
  nowPlayingId: null,
  updatedAt: new Date(0).toISOString(),
};

export const dynamic = "force-dynamic";

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return Response.json(
      { error: "kv_unavailable", message: "KV not configured on this deploy" },
      { status: 503 },
    );
  }
  const [state, queue] = await Promise.all([
    redis.get<State>(KV_KEYS.state),
    redis.get<QueueItem[]>(KV_KEYS.queue),
  ]);
  const s = state ?? DEFAULT_STATE;
  const q = queue ?? [];

  let nowPlaying: StatePublic["nowPlaying"] = null;
  if (s.nowPlayingId) {
    const item = q.find((qi) => qi.id === s.nowPlayingId);
    if (item) {
      const song = catalog.find((c) => c.id === item.songId);
      if (song) {
        nowPlaying = {
          songId: song.id,
          title: song.title,
          artist: song.artist,
        };
      }
    }
  }

  const body: StatePublic = {
    acceptingRequests: s.acceptingRequests,
    nowPlayingId: s.nowPlayingId,
    queueLength: q.length,
    nowPlaying,
  };
  return Response.json(body);
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) {
    return Response.json({ error: "kv_unavailable" }, { status: 503 });
  }
  let body: Partial<Pick<State, "acceptingRequests" | "nowPlayingId">>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const current = (await redis.get<State>(KV_KEYS.state)) ?? DEFAULT_STATE;
  const next: State = {
    acceptingRequests:
      typeof body.acceptingRequests === "boolean"
        ? body.acceptingRequests
        : current.acceptingRequests,
    nowPlayingId:
      body.nowPlayingId === null || typeof body.nowPlayingId === "string"
        ? body.nowPlayingId
        : current.nowPlayingId,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(KV_KEYS.state, next);
  return Response.json(next);
}
