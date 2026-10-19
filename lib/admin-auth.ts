import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "pw_admin";
export const SESSION_TTL_SEC = 30 * 24 * 60 * 60;
/** Failed logins allowed per IP inside LOGIN_WINDOW_SEC. */
export const LOGIN_LIMIT = 5;
export const LOGIN_WINDOW_SEC = 15 * 60;

function hmac(key: string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

export function passwordMatches(given: unknown, expected: string | undefined): boolean {
  if (!expected || typeof given !== "string" || !given) return false;
  return safeEqual(hmac("pw", given), hmac("pw", expected));
}

/**
 * Session token `<expiry>.<mac>`, keyed by the admin password so changing
 * the password signs everyone out.
 */
export function signSession(secret: string, now: Date, ttlSec = SESSION_TTL_SEC): string {
  const exp = Math.floor(now.getTime() / 1000) + ttlSec;
  return `${exp}.${hmac(secret, `admin:${exp}`).toString("base64url")}`;
}

export function verifySession(
  token: string | undefined,
  secret: string | undefined,
  now: Date,
): boolean {
  if (!token || !secret) return false;
  const [expRaw, mac] = token.split(".");
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || !mac || exp * 1000 <= now.getTime()) return false;
  return safeEqual(Buffer.from(mac, "base64url"), hmac(secret, `admin:${exp}`));
}
