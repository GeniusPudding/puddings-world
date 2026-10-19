import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin-auth";
import { dayKey, isBot, normalizePath, STATS_TTL_SEC, statsKeys, trafficSource } from "@/lib/analytics";
import { getRedis } from "@/lib/ktv/kv";
import { clientIp, hashIp } from "@/lib/ktv/rate-limit";

const NO_CONTENT = new NextResponse(null, { status: 204 });

export async function POST(req: Request) {
  const redis = getRedis();
  if (!redis || isBot(req.headers.get("user-agent"))) return NO_CONTENT;
  const session = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (verifySession(session, process.env.ADMIN_PASSWORD, new Date())) return NO_CONTENT;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const path = normalizePath(body?.path);
  if (!path) return NO_CONTENT;

  const keys = statsKeys(dayKey(new Date()));
  const source = trafficSource(body?.referrer, body?.utm);
  const country = req.headers.get("x-vercel-ip-country");

  const tx = redis.multi();
  tx.hincrby(keys.views, path, 1);
  tx.pfadd(keys.visitors, hashIp(clientIp(req)));
  if (source) tx.hincrby(keys.sources, source, 1);
  if (country) tx.hincrby(keys.countries, country.slice(0, 2), 1);
  for (const key of Object.values(keys)) tx.expire(key, STATS_TTL_SEC);
  await tx.exec();
  return NO_CONTENT;
}
