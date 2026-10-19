import { NextResponse } from "next/server";
import { parseContact, RATE_LIMIT, RATE_WINDOW_SEC, renderEmail } from "@/lib/contact";
import { getRedis } from "@/lib/ktv/kv";
import { clientIp, hashIp } from "@/lib/ktv/rate-limit";

const INBOX_KEY = "contact:messages";
const INBOX_CAP = 500;
const TO = process.env.CONTACT_TO ?? "geniuspuddingforgames@gmail.com";
const FROM = process.env.CONTACT_FROM ?? "puddingsworld <onboarding@resend.dev>";

async function sendEmail(subject: string, text: string, replyTo?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) console.error("contact: Resend", res.status, (await res.text()).slice(0, 200));
  return res.ok;
}

export async function POST(req: Request) {
  const parsed = parseContact(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if ("spam" in parsed) return NextResponse.json({ ok: true });

  const redis = getRedis();
  if (redis) {
    const rateKey = `contact:rate:${hashIp(clientIp(req))}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, RATE_WINDOW_SEC);
    if (count > RATE_LIMIT) {
      return NextResponse.json(
        { error: "Too many messages from here. Try again in a few minutes." },
        { status: 429 },
      );
    }
  }

  const receivedAt = new Date();
  let stored = false;
  if (redis) {
    await redis.lpush(
      INBOX_KEY,
      JSON.stringify({ ...parsed.value, receivedAt: receivedAt.toISOString() }),
    );
    await redis.ltrim(INBOX_KEY, 0, INBOX_CAP - 1);
    stored = true;
  }
  const { subject, text } = renderEmail(parsed.value, receivedAt);
  const sent = await sendEmail(subject, text, parsed.value.email);

  if (!stored && !sent) {
    return NextResponse.json(
      { error: "The message box isn't set up yet. Please email me directly." },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true });
}
