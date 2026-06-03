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
  /** Small caption: "lyrics for ___", "dessert lab — 第 3 號實驗" */
  meta?: string;
  /** Optional hero image (under /public, e.g. "/musings/<slug>.jpg"). */
  image?: string;
  imageCaption?: string;
};

// ---------------------------------------------------------------------------
// Replace these placeholders with real pieces. The page handles four types
// out of the box: poem · lyrics · dessert · note. Add more types in MusingType
// (and TYPE_STYLE in components/MusingsCarousel.tsx) if needed later.
// ---------------------------------------------------------------------------

export const musings: Musing[] = [
  {
    slug: "morning-mist",
    type: "poem",
    date: "2026-04-30",
    body: "霧靄沉沉的清晨\n我把昨夜的夢\n折成一張紙船\n放進咖啡裡",
  },
  {
    slug: "an-empty-room",
    type: "note",
    date: "2026-04-02",
    body: "An empty room is not silence —\nit is the sum of every sound\nthe walls have learned to remember\nand chosen, today, not to repeat.",
  },
];
