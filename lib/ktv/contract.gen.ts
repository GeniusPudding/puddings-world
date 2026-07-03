// DO NOT EDIT — generated from contract/ktv-contract.json by tools/gen_contract.py
export const KTV_CONTRACT_VERSION = "4.1.0" as const;
export const KTV_BASE_URL = "https://puddings-world.com";
export const KTV_API_PREFIX = "/api/ktv";

export type Language = 'zh' | 'en' | 'jp' | 'ko' | 'other';
export type GenderVariant = 'female' | 'male';
export type MessageRole = 'audience' | 'performer';

/** A selectable song. Mirror of one phone-local m4a (rev 3.4 Option B). KV: ktv:catalog. */
export type CatalogSong = {
  id: string;  // stable slug, slug_id(title), three-sided algorithm
  title: string;
  artist: string;
  language: Language;
  durationSec?: number;
  tags?: string[];
  keyOffset?: number;  // performer per-song semitone override, default 0
  genderVariant?: GenderVariant | null;
  category?: string;  // e.g. mandarin_pop
};

/** A request in the live queue. KV: ktv:queue (oldest -> newest). requesterName/message are rev 2.1 deprecated wire-compat fields, unused. */
export type QueueItem = {
  id: string;  // nanoid
  songId: string;  // CatalogSong.id
  requesterName?: string;
  message?: string;
  addedAt: string;  // ISO 8601
};

/** Body for POST /api/ktv/queue. */
export type EnqueueRequest = {
  songId: string;
  requesterName?: string;
  message?: string;
};

/** Response of POST /api/ktv/queue. cancelToken lets the audience self-delete (X-Cancel-Token). */
export type EnqueueResponse = {
  id: string;
  cancelToken?: string;
  position: number;
  queueLength: number;
};

/** Denormalized current song for audience display. */
export type NowPlayingInfo = {
  songId: string;
  title: string;
  artist?: string;
};

/** Gig state. KV: ktv:state. GET /api/ktv/state also returns derived fields (queue, nowPlaying, messages, lastMessageAt) that are NOT stored in KV. */
export type KtvState = {
  acceptingRequests: boolean;
  acceptingMessages: boolean;  // rev 4.1; gate audience message POST
  nowPlayingId?: string | null;  // QueueItem.id
  updatedAt?: string;  // ISO 8601
  queueLength: number;
  nowPlaying?: NowPlayingInfo;
  queue?: QueueItem[];  // PII-stripped, excludes nowPlaying row
  messages?: ChatMessage[];  // rev 4.1; last 30, PII-stripped
  lastMessageAt?: string | null;  // rev 4.1; newest ChatMessage.createdAt
};

/** Body for PATCH /api/ktv/state. Omitted = leave alone. nowPlayingId explicit null clears it. */
export type StatePatch = {
  acceptingRequests?: boolean;
  acceptingMessages?: boolean;
  nowPlayingId?: string | null;
};

/** rev 4.1 live message board entry. KV: ktv:messages (oldest -> newest, server caps last 200). ipHash/cancelToken are internal, always stripped from GET responses. */
export type ChatMessage = {
  id: string;  // nanoid
  role: MessageRole;  // server-stamped from auth; client cannot set
  name?: string;  // optional nickname, audience only, <=16 chars
  text: string;  // <=200 chars, sanitized
  createdAt: string;  // ISO 8601
};

/** Body for POST /api/ktv/messages. role is NOT accepted from client (server stamps it). */
export type PostMessageRequest = {
  text: string;
  name?: string;  // audience nickname; ignored when bearer (performer)
};

/** Response of POST /api/ktv/messages. */
export type PostMessageResponse = {
  id: string;
  cancelToken?: string;  // nanoid(16), audience self-delete token
  createdAt: string;
};

export type KtvErrorCode = 'bad_request' | 'unauthorized' | 'not_accepting' | 'unknown_song' | 'duplicate' | 'quota_exceeded' | 'rate_limit';
export const KTV_ERROR_HTTP: Record<KtvErrorCode, number> = {
  'bad_request': 400,
  'unauthorized': 401,
  'not_accepting': 403,
  'unknown_song': 404,
  'duplicate': 409,
  'quota_exceeded': 429,
  'rate_limit': 429,
};

export const KTV_ENDPOINTS = [
  { method: 'GET', path: '/api/ktv/catalog', auth: 'public' },
  { method: 'POST', path: '/api/ktv/catalog', auth: 'bearer' },
  { method: 'DELETE', path: '/api/ktv/catalog/:id', auth: 'bearer' },
  { method: 'PUT', path: '/api/ktv/catalog', auth: 'bearer' },
  { method: 'GET', path: '/api/ktv/state', auth: 'public' },
  { method: 'PATCH', path: '/api/ktv/state', auth: 'bearer' },
  { method: 'GET', path: '/api/ktv/queue', auth: 'bearer' },
  { method: 'POST', path: '/api/ktv/queue', auth: 'public' },
  { method: 'DELETE', path: '/api/ktv/queue/:id', auth: 'bearer|cancelToken' },
  { method: 'DELETE', path: '/api/ktv/queue', auth: 'bearer' },
  { method: 'GET', path: '/api/ktv/messages', auth: 'public' },
  { method: 'POST', path: '/api/ktv/messages', auth: 'public' },
  { method: 'DELETE', path: '/api/ktv/messages/:id', auth: 'bearer|cancelToken' },
  { method: 'DELETE', path: '/api/ktv/messages', auth: 'bearer' },
] as const;
