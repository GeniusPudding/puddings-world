import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  LOGIN_LIMIT,
  LOGIN_WINDOW_SEC,
  passwordMatches,
  SESSION_TTL_SEC,
  signSession,
} from "@/lib/admin-auth";
import { logEvent } from "@/lib/event-log";
import { getRedis } from "@/lib/ktv/kv";
import { clientIp, hashIp } from "@/lib/ktv/rate-limit";

export async function POST(req: Request) {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 503 });
  }

  const ipHash = hashIp(clientIp(req));
  const redis = getRedis();
  const failKey = `admin:fail:${ipHash}`;
  if (redis && Number(await redis.get(failKey)) >= LOGIN_LIMIT) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  if (!passwordMatches(body?.password, secret)) {
    if (redis) {
      const fails = await redis.incr(failKey);
      if (fails === 1) await redis.expire(failKey, LOGIN_WINDOW_SEC);
    }
    await logEvent("admin.login_failed", `ip ${ipHash}`);
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  if (redis) await redis.del(failKey);
  await logEvent("admin.login", `ip ${ipHash}`);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, signSession(secret, new Date()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
  return res;
}
