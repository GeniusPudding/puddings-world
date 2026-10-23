// Public "Now building" copy for the home page. Refreshed weekly from the
// owner's private development notes; keep it to what is fine to say out loud.
//
// Format for whoever (or whatever) regenerates this file:
// - `note`: one or two sentences. Wrap the one or two phrases a skimming
//   reader should catch in `**double asterisks**`; nothing else is parsed.
// - `href`: only public GitHub repos or pages already on this site.
// - `image`: optional screenshot under public/now/, 16:9, 1280×720, kept
//   under ~150 KB (it is served as-is, bypassing the image optimizer, which
//   hung on a UI screenshot). Cards without one get a monogram tile instead.

export type NowItem = {
  title: string;
  note: string;
  href?: string;
  image?: string;
};

export const now = {
  updated: "2026-10-19",
  items: [
    {
      title: "Paperfact",
      note: "I'm building **Paperfact, a desktop reader that turns any paper into a guided reading session**: AI commentary paragraph by paragraph, a citation map of what a paper builds on and what built on it, and a nightly reading queue across ICLR, ICML and NeurIPS. Recent work added math and diagram typesetting, keyboard-first navigation, shareable reading-list bundles, a macOS build, and a round that **drafts a presentation-ready slide deck from a close reading**.",
      image: "/now/paperfact.jpg",
    },
    {
      title: "Mapetite",
      note: "I'm building a **browser extension that curates food places on top of Google Maps**. Saved places **sync both ways with Google lists** in near real time, and the smart input now understands time of day, finds saved places near a landmark, and remembers tags I take off so the AI never puts them back.",
      image: "/now/mapetite.jpg",
    },
    {
      title: "Agent CLI companions",
      note: "I'm building **three small companions for terminal coding agents, Claude Code, Codex and Gemini CLI alike**: Kaikou for Chinese voice input, Clip for pasting screenshots where the CLI has no image paste, Listen for spoken replies in my own voice. Kaikou now picks the loudest mic, converts to Traditional script and warms its model up, and gained a **bench for comparing speech recognizers on my own recordings**; Clip finished an audit pass and Listen's speech server stopped popping console windows.",
      href: "/projects/kaikou-claude",
    },
    {
      title: "Assistant Hub",
      note: "I'm building a **personal command centre**: a task ledger, routines, widgets, a phone view and a desktop sidebar. This week it gained **automatic triage of phone captures**, a listening player for lecture series, a project view with each line's git activity, and the weekly draft that keeps this section up to date.",
      image: "/now/assistant-hub.jpg",
    },
    {
      title: "Street KTV & Mandopop pipeline",
      note: "I'm running a **music line from dataset to stage**: MandpopDataPipeline turns Mandarin pop into separated stems and time-aligned lyrics, Reprise Studio renders those into abstract lyric videos, and Street KTV is the gig-side app, a **performer app on Android with a live audience songbook on this site** where listeners scan a QR code and queue songs.",
      href: "/playground/street-ktv-menu",
      image: "/now/street-ktv.png",
    },
    {
      title: "Virtual Embryo Challenge",
      note: "I'm competing in the **Virtual Embryo Challenge at NeurIPS 2026**. My toolkit now covers pseudobulk-shift baselines, in-silico knockouts, delta and recompose steps for building hypotheses, and **submissions straight through the challenge API**, ahead of the final deadline in early December.",
    },
    {
      title: "Cataract surgery video analysis",
      note: "I'm starting a **research line on cataract surgery video**. The first study is scoped around **capsulorhexis tracking and surgical-skill assessment**, building on a published benchmark.",
    },
    {
      title: "Xensur Medical",
      note: "I'm **co-building a medical startup**. We've placed well in a few startup competitions this autumn and are preparing for a **pitch final at the end of October**.",
    },
    {
      title: "TOEFL sprint",
      note: "I'm on a **16-week TOEFL sprint using my own daily trainer**, 90 minutes a day, with a re-diagnosis in early November and a first sitting planned for early next year.",
      href: "/services/toefl-trainer",
      image: "/now/toefl-sprint.png",
    },
    {
      title: "This site",
      note: "I'm keeping this site as a mount surface for the tools above. The **projects page is discovered from GitHub topics** and refreshes weekly, now with thumbnails and eight more repos, and this section gets a weekly draft I review before it goes live.",
      href: "/projects",
      image: "/now/this-site.png",
    },
  ] satisfies NowItem[],
};
