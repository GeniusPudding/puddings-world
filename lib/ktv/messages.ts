import type { ChatMessage, ChatMessagePublic } from "./types";

export const MAX_TEXT_LEN = 200;
export const MAX_NICKNAME_LEN = 16;
/** Server-side cap on `ktv:messages` length (spec §1.5.12.9). */
export const MESSAGES_CAP = 200;
/** Trailing window returned by GET /state and default GET /messages. */
export const MESSAGES_TAIL = 30;
/**
 * Audience POST cooldown in seconds. Time-based, not the queue's
 * quota-of-2 — chat naturally runs at a higher rate than song requests
 * (spec §1.5.12.4). Performer bearer bypasses.
 */
export const MESSAGE_COOLDOWN_SEC = 3;

/** Display name stamped on performer-authored messages (client name ignored). */
export const PERFORMER_DISPLAY_NAME =
  process.env.KTV_PERFORMER_NAME ?? "GeniusPudding";

// eslint-disable-next-line no-control-regex
const CONTROL_OR_ZERO_WIDTH = new RegExp(
  "[\\u0000-\\u001f\\u007f\\u200b-\\u200d\\u2060\\ufeff]",
  "g",
);

/** Trim + drop control / zero-width chars. Returns "" when nothing survives. */
export function sanitizeMessageText(raw: string): string {
  return raw.replace(CONTROL_OR_ZERO_WIDTH, "").trim();
}

export function toPublicMessage(m: ChatMessage): ChatMessagePublic {
  return {
    id: m.id,
    role: m.role,
    name: m.name,
    text: m.text,
    createdAt: m.createdAt,
  };
}
