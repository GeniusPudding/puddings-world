export type MusingType = "poem" | "lyrics" | "dessert" | "note";

export type Musing = {
  slug: string;
  type: MusingType;
  /** Optional title — short poems often skip it. */
  title?: string;
  /** YYYY-MM-DD. Used for chronological sort and small caption. */
  date?: string;
  /** Full body. Render \n as line break, \n\n as paragraph break. */
  body: string;
  /** Optional shorter version shown on the carousel card. Falls back to body. */
  excerpt?: string;
  /** A line or two for a lyrics card's cover; the full words wait inside. */
  hook?: string;
  /** Small caption: "lyrics for ___", "dessert lab — 第 3 號實驗" */
  meta?: string;
  /** Recording to play with the piece (https URL). */
  audio?: string;
  /** Optional hero image (under /public, e.g. "/musings/<slug>.jpg"). */
  image?: string;
  imageCaption?: string;
};

/** A one- or two-line saying. Shown as a card wall on /musings, no detail page. */
export type Saying = {
  text: string;
  /** YYYY-MM-DD, or just YYYY when the exact day is lost. */
  date?: string;
  /** Optional small caption: where or why it came up. */
  context?: string;
};

export const sayings: Saying[] = [];

// Hand-written pieces that don't live in a Google Doc. Most musings come
// from content/musing-sources.ts. Types: poem · lyrics · dessert · note.
export const musings: Musing[] = [];
