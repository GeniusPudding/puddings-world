import { catalog } from "@/content/ktv-catalog";
import { isAuthorized } from "@/lib/ktv/auth";
import { getRedis, KV_KEYS } from "@/lib/ktv/kv";
import type {
  QueueEntryPublic,
  QueueItem,
  State,
  StatePublic,
} from "@/lib/ktv/types";

const DEFAULT_STATE: State = {
  acceptingRequests: true,
  nowPlayingId: null,
  updatedAt: new Date(0).toISOString(),
};

// Audience polls /state every 5s. Edge-cache for 2s so a busy gig with
// dozens of phones doesn't multiply KV reads. Up to 2s of staleness is
// imperceptible for queue / now-playing UX.
const PUBLIC_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=2, stale-while-revalidate=4",
};
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET() {
  const redis = getRedis();
  if (!redis) {
    return Response.json(
      { error: "kv_unavailable", message: "KV not configured on this deploy" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
  // mget bills as a single Upstash command and returns both values in one
  // round-trip (vs two separate .get calls = two commands).
  const [state, queue] = await redis.mget<
    [State | null, QueueItem[] | null]
  >(KV_KEYS.state, KV_KEYS.queue);
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

  // Strip PII (ipHash, requesterName, message) and exclude the now-playing
  // item from the public 'up next' list.
  const queuePublic: QueueEntryPublic[] = q
    .filter((qi) => qi.id !== s.nowPlayingId)
    .map((qi) => {
      const song = catalog.find((c) => c.id === qi.songId);
      return {
        id: qi.id,
        songId: qi.songId,
        title: song?.title ?? qi.songId,
        artist: song?.artist ?? "",
        addedAt: qi.addedAt,
      };
    });

  const body: StatePublic = {
    acceptingRequests: s.acceptingRequests,
    nowPlayingId: s.nowPlayingId,
    nowPlaying,
    queue: queuePublic,
  };
  return Response.json(body, { headers: PUBLIC_CACHE_HEADERS });
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
