export type SongLanguage = "zh" | "en" | "jp" | "ko" | "other";

export type Song = {
  /** Stable slug — used as canonical reference in queue items. */
  id: string;
  title: string;
  artist: string;
  language: SongLanguage;
  /** Optional performance key, e.g. "C major" / "Capo 3". */
  key?: string;
  durationSec?: number;
  tags?: string[];
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
  nowPlayingId: string | null;
  updatedAt: string;
};

export type QueueEntryPublic = {
  id: string;
  songId: string;
  title: string;
  artist: string;
  addedAt: string;
};

export type StatePublic = {
  acceptingRequests: boolean;
  nowPlayingId: string | null;
  /** Joined catalog info for the now-playing song, when set. */
  nowPlaying: { songId: string; title: string; artist: string } | null;
  /** Full queue (oldest → newest). PII fields stripped. */
  queue: QueueEntryPublic[];
};
