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
    slug: "tbd-song",
    type: "lyrics",
    title: "TBD song",
    date: "2026-04-15",
    meta: "lyrics — melody TBD",
    body: "TODO: 副歌四行佔位\n這幾行會被讀者反覆唱起\n所以最該寫得淺白\n但又禁得起追問\n\nTODO: 第一段、第二段、橋段\n之後填進這裡。\n換行用 \\n、段落用空行。",
    excerpt:
      "TODO: 副歌四行佔位\n這幾行會被讀者反覆唱起\n所以最該寫得淺白\n但又禁得起追問",
  },
  {
    slug: "basque-cheesecake-v1",
    type: "dessert",
    title: "巴斯克起司蛋糕 v1",
    date: "2026-03-15",
    meta: "dessert lab — 第 3 號實驗",
    body: "TODO（起手）：為什麼開始做這個？三個禮拜的午後在 Pinterest 上滑到一張焦黑表皮、奶油芯爆漿的照片，從此忘不掉。\n\nTODO（過程）：第一次烤箱溫度設太低，蛋糕中間沒熟；第二次太高，整片焦掉。第三次找到那個甜蜜點。\n\nTODO（結果）：成品的口感、跟哪一杯咖啡最配、下一版想試什麼方向。",
    excerpt:
      "TODO（起手）：為什麼開始做這個？三個禮拜的午後在 Pinterest 上滑到一張焦黑表皮、奶油芯爆漿的照片，從此忘不掉。",
    image: "/musings/basque-cheesecake-v1.jpg",
    imageCaption: "first batch out of the oven",
  },
  {
    slug: "an-empty-room",
    type: "note",
    date: "2026-04-02",
    body: "An empty room is not silence —\nit is the sum of every sound\nthe walls have learned to remember\nand chosen, today, not to repeat.",
  },
];
