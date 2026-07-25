// KV-internal storage shapes. Wire-contract types live in ./contract.gen.ts
// (vendored from StreetPerformerMaster — see CLAUDE.md "Cross-project service
// mounts"). Fields like ipHash / cancelToken exist only here on purpose.

export type SongLanguage = "zh" | "en" | "jp" | "ko" | "other";

export type Song = {
  /** Stable slug — used as canonical reference in queue items. */
  id: string;
  title: string;
  artist: string;
  language: SongLanguage;
  /** Optional descriptive musical key, e.g. "C major" / "Capo 3". */
  key?: string;
  durationSec?: number;
  tags?: string[];
  /** Performer's pitch transposition in semitones (e.g. -2 = down 2 semitones). */
  keyOffset?: number;
  genderVariant?: "female" | "male" | null;
  /** Loose grouping label, e.g. "mandarin_pop". */
  category?: string;
};

export type QueueItem = {
  id: string;
  songId: string;
  requesterName?: string;
  message?: string;
  addedAt: string;
  /** Internal: SHA-256(ip).slice(0,16) used for rate limiting. Stripped from public responses. */
  ipHash?: string;
  /**
   * Internal: short random token returned to the audience at POST time so
   * they can DELETE their own item without bearer auth by sending it back
   * in the `X-Cancel-Token` header. Stripped from all public responses.
   */
  cancelToken?: string;
};

export type State = {
  acceptingRequests: boolean;
  /**
   * Gate for audience message POSTs (rev 4.1). Missing on states written
   * before the message board existed — readers must default it to true.
   */
  acceptingMessages?: boolean;
  nowPlayingId: string | null;
  updatedAt: string;
};

export type ChatRole = "audience" | "performer";

/** rev 4.1 live message board entry, KV `ktv:messages` (oldest → newest). */
export type ChatMessage = {
  id: string;
  /** Stamped server-side from auth — client-supplied role is ignored. */
  role: ChatRole;
  /** Optional nickname (audience) or the fixed performer display name. */
  name?: string;
  text: string;
  createdAt: string;
  /** Internal: same anti-spam hash as QueueItem.ipHash. Stripped from responses. */
  ipHash?: string;
  /** Internal: audience self-delete credential, returned once at POST time. */
  cancelToken?: string;
};

export type ChatMessagePublic = Pick<
  ChatMessage,
  "id" | "role" | "name" | "text" | "createdAt"
>;

export type QueueEntryPublic = {
  id: string;
  songId: string;
  title: string;
  artist: string;
  addedAt: string;
};

export type StatePublic = {
  acceptingRequests: boolean;
  acceptingMessages: boolean;
  nowPlayingId: string | null;
  /** Joined catalog info for the now-playing song, when set. */
  nowPlaying: { songId: string; title: string; artist: string } | null;
  /** Full queue (oldest → newest). PII fields stripped. */
  queue: QueueEntryPublic[];
  /**
   * Message-board tail (last 30, oldest → newest) folded into the state
   * poll so audience phones need zero extra requests (spec §1.5.12.6).
   */
  messages: ChatMessagePublic[];
  /** createdAt of the newest message; cheap change-detection marker. */
  lastMessageAt: string | null;
};
