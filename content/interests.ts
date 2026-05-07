// ---------------------------------------------------------------------------
// /interests — what I CONSUME (inputs).
// What I CREATE goes elsewhere:
//   - poems / lyrics / dessert stories   →  /musings
//   - games / demos / weird side projects → /playground
//   - code / research                     → /projects
//
// To fill in a section: add items to its `items` array, optionally write a
// one-line `whyThese`. Empty arrays render an "edit content/interests.ts"
// hint until they're populated, so leaving placeholders is safe.
// ---------------------------------------------------------------------------

export type InterestItem = {
  /** Main label, left-aligned. e.g. book title, artist name, restaurant */
  primary: string;
  /** Right-aligned secondary line. e.g. author · year, signature dish */
  secondary?: string;
  /** Optional outbound link */
  href?: string;
};

export type InterestSection = {
  slug: "reading" | "listening" | "playing" | "watching" | "eating";
  label: string;
  /** One-line description rendered under the section title */
  eyebrow: string;
  items: InterestItem[];
  /** One-line "why I picked these" — what they have in common, what they say about you */
  whyThese?: string;
};

export const interests: InterestSection[] = [
  {
    slug: "reading",
    label: "Reading",
    eyebrow: "Books, long essays, newsletters that fed me.",
    items: [
      // example shape — replace with your real picks:
      // { primary: "The Information", secondary: "James Gleick · 2011" },
      // { primary: "Gödel, Escher, Bach", secondary: "Hofstadter · 1979" },
      // { primary: "Stratechery", secondary: "Ben Thompson · weekly", href: "https://stratechery.com" },
    ],
    whyThese: undefined,
  },
  {
    slug: "listening",
    label: "Listening",
    eyebrow: "Music and podcasts on heavy rotation.",
    items: [
      // { primary: "Radiohead", secondary: "OK Computer / In Rainbows" },
      // { primary: "Aphex Twin", secondary: "Selected Ambient Works II" },
      // { primary: "Acquired", secondary: "podcast — biz history", href: "https://acquired.fm" },
    ],
    whyThese: undefined,
  },
  {
    slug: "playing",
    label: "Playing",
    eyebrow: "Games I sit down to play (not games I make).",
    items: [
      // { primary: "Slay the Spire", secondary: "deck-builder roguelike" },
      // { primary: "圍棋", secondary: "9-段路上, KGS 1k" },
      // { primary: "Catan", secondary: "桌遊, 比對手更討厭羊" },
    ],
    whyThese: undefined,
  },
  {
    slug: "watching",
    label: "Watching",
    eyebrow: "Films, shows, channels — the ones that taught or moved me.",
    items: [
      // { primary: "泛科學", secondary: "YouTube — 中文科普", href: "https://www.youtube.com/@PanSci" },
      // { primary: "Tom Scott", secondary: "YouTube — kind of curious", href: "https://www.youtube.com/@TomScottGo" },
      // { primary: "Severance", secondary: "TV · 2022—" },
    ],
    whyThese: undefined,
  },
  {
    slug: "eating",
    label: "Eating",
    eyebrow: "Restaurants and food experiences worth the detour.",
    items: [
      // { primary: "永康街 思慕昔", secondary: "芒果冰" },
      // { primary: "京都 一保堂", secondary: "玉露" },
      // { primary: "某家不能說的滷肉飯", secondary: "台北東區" },
    ],
    whyThese: undefined,
  },
];
