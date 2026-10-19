// ---------------------------------------------------------------------------
// /interests — what I keep returning to.
// What I CREATE goes elsewhere:
//   - lyrics / sayings / short pieces      →  /musings
//   - games / demos / weird side projects  →  /playground
//   - code / research                      →  /projects
//
// Sections with `items` render as full lists; sections without items render
// as compact cards under "Also into", so a topic can be listed before it has
// picks. Keep every line true and first-person; no filler.
// ---------------------------------------------------------------------------

export type InterestItem = {
  /** Main label, left-aligned. e.g. paper title, restaurant */
  primary: string;
  /** Right-aligned secondary line. e.g. venue · year, dish type · area */
  secondary?: string;
  /** Optional outbound link */
  href?: string;
};

export type InterestSection = {
  slug: string;
  label: string;
  /** One-line description rendered under the section title */
  eyebrow: string;
  items: InterestItem[];
  /** One-line "why these" — what the picks have in common */
  whyThese?: string;
  /** Optional link for the whole section (compact cards only) */
  href?: string;
};

const arxiv = (id: string) => `https://arxiv.org/abs/${id}`;

export const interests: InterestSection[] = [
  {
    slug: "papers",
    label: "Papers",
    eyebrow:
      "AI / ML, mostly large language models: what I've read closely lately, outside my own research line.",
    items: [
      {
        primary: "The Art of Scaling Reinforcement Learning Compute for LLMs",
        secondary: "ICLR 2026",
        href: arxiv("2510.13786"),
      },
      {
        primary: "DAPO: An Open-Source LLM Reinforcement Learning System at Scale",
        secondary: "NeurIPS 2025",
        href: arxiv("2503.14476"),
      },
      {
        primary: "Reasoning with Sampling: Your Base Model is Smarter Than You Think",
        secondary: "ICLR 2026",
        href: arxiv("2510.14901"),
      },
      {
        primary: "The Coverage Principle: How Pre-Training Enables Post-Training",
        secondary: "ICLR 2026",
        href: arxiv("2510.15020"),
      },
      {
        primary: "GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning",
        secondary: "ICLR 2026",
        href: arxiv("2507.19457"),
      },
      {
        primary: "LLMs Get Lost In Multi-Turn Conversation",
        secondary: "ICLR 2026",
        href: arxiv("2505.06120"),
      },
      {
        primary: "Data Mixing Laws: Optimizing Data Mixtures by Predicting LM Performance",
        secondary: "ICLR 2025",
        href: arxiv("2403.16952"),
      },
      {
        primary: "Learning to See Before Seeing: LLM Visual Priors from Language Pre-training",
        secondary: "ICLR 2026",
        href: arxiv("2509.26625"),
      },
      {
        primary: "The Polar Express: Optimal Matrix Sign Methods and the Muon Algorithm",
        secondary: "ICLR 2026",
        href: arxiv("2505.16932"),
      },
      {
        primary: "τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment",
        secondary: "ICML 2026",
        href: arxiv("2506.07982"),
      },
    ],
    whyThese:
      "Picked from what I read in Paperfact, my own paper reader. The thread: what post-training can and can't add on top of a pre-trained model.",
  },
  {
    slug: "music",
    label: "Music",
    eyebrow:
      "I sing Mandopop on the street and write my own lyrics and songs.",
    items: [
      {
        primary: "The live songbook: 172 songs I perform",
        secondary: "Street KTV",
        href: "/playground/street-ktv-menu",
      },
      {
        primary: "Lyrics I've written",
        secondary: "/musings",
        href: "/musings",
      },
    ],
  },
  {
    slug: "food",
    label: "Food",
    eyebrow:
      "Places I've saved and keep going back to, mostly in Taipei. Desserts are a weakness; the site is called pudding for a reason.",
    items: [
      {
        primary: "太郎製菓",
        secondary: "Japanese sweets · 大安",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442a9d159f3a277:0xfa04b4d6af078fe2",
      },
      {
        primary: "Goody Pâtisserie 古迪法式甜點",
        secondary: "French pastry · 信義",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442ab5dd7ed68eb:0x2756a0756c96443c",
      },
      {
        primary: "三日月茶空間",
        secondary: "wagashi & tea · 大安",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442ae7de190d213:0x271050aa3c2288c3",
      },
      {
        primary: "聚食釜",
        secondary: "Taiwanese shrimp-broth hot pot · 大安",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442ab10a193f415:0x989ddec32cf7cc7a",
      },
      {
        primary: "DOMO Yakitori",
        secondary: "charcoal yakitori · 信義",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442ab3a0c1d87a7:0xdee354f41c403dbf",
      },
      {
        primary: "木麒麟拉麵",
        secondary: "ramen · 中山",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442a90579536a0d:0x41e41f95a5e49d05",
      },
      {
        primary: "哦耶！旁遮普印度餐廳",
        secondary: "Punjabi curry · 大安",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442abc69d3f2ecb:0x6e9156b622a855e",
      },
      {
        primary: "不葷主義茶餐廳",
        secondary: "vegetarian cha chaan teng · 松山",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442abf7d9ca1965:0x7c180b7feedd5d2",
      },
      {
        primary: "八分目珈琲",
        secondary: "coffee · 大安",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3442ab4d2c6c1b6f:0x7bc1384e34aba0b9",
      },
      {
        primary: "Ramen Oyster And Shell",
        secondary: "oyster ramen · Tokyo",
        href: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x60188b85c24c5b0f:0x268b397465264598",
      },
    ],
    whyThese:
      "Ten of the 195 favourites among 1,242 places I've saved, sorted with Mapetite, the Maps extension I built for exactly this.",
  },
  {
    slug: "go",
    label: "Go 圍棋",
    eyebrow: "A game I play and keep thinking about; InvisibleGo, my hidden-board variant, came out of it.",
    items: [],
    href: "/projects/invisiblego",
  },
  {
    slug: "basketball",
    label: "Basketball 籃球",
    eyebrow: "The sport I keep coming back to.",
    items: [],
  },
  {
    slug: "science",
    label: "Math & natural science",
    eyebrow: "Math and the natural sciences, for the fun of it, not only for papers.",
    items: [],
  },
  {
    slug: "literature",
    label: "Literature 文學",
    eyebrow: "Reading that feeds my own writing: lyrics and short pieces.",
    items: [],
    href: "/musings",
  },
  {
    slug: "history",
    label: "History 歷史",
    eyebrow: "How people and ideas got from there to here.",
    items: [],
  },
];
