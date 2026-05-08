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
};

export type State = {
  acceptingRequests: boolean;
  nowPlayingId: string | null;
  updatedAt: string;
};

export type StatePublic = {
  acceptingRequests: boolean;
  nowPlayingId: string | null;
  queueLength: number;
  /** Joined catalog info for the now-playing song, when set. */
  nowPlaying?: { songId: string; title: string; artist: string } | null;
};
