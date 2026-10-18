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
  updated: "2026-10-18",
  items: [
    {
      title: "paper-daily",
      note: "I'm building a **nightly reading queue for ICLR, ICML and NeurIPS papers** with its own desktop reader. This week it learned proper math and diagram typesetting, a keyboard-first list view, exportable reading-list bundles, a macOS build, and a round that **drafts a presentation-ready slide deck from a close reading**.",
    },
    {
      title: "Mapetite",
      note: "I'm building a **browser extension that curates food places on top of Google Maps**. Saved places now **sync both ways with Google lists** in near real time, candidates are filtered down to actual food, and the first review and visit-tracking cards just landed.",
    },
    {
      title: "Kaikou-Claude",
      note: "I'm making **Chinese voice input for Claude Code and Codex**. This week I cut idle CPU use, added automatic mic picking, Simplified-to-Traditional conversion and model warm-up, and built a **bench to compare Whisper, Breeze, Qwen3 and FireRed** on my own recordings.",
      href: "/projects/kaikou-claude",
    },
    {
      title: "Assistant Hub",
      note: "I'm building a **personal command centre**: a task ledger, routines, widgets, a phone view and a desktop sidebar. This week it gained **automatic triage of phone captures**, a listening player for lecture series, and a weekly watcher for campus talks.",
    },
    {
      title: "Virtual Embryo Challenge",
      note: "I'm competing in the **Virtual Embryo Challenge at NeurIPS 2026**. This week's tooling covers pseudobulk-shift baselines, in-silico knockouts, delta and recompose steps for hypothesis building, and **submissions straight through the challenge API**, with the final deadline in early December.",
    },
    {
      title: "Cataract surgery video analysis",
      note: "I'm starting a **research line on cataract surgery video**. The first study is now scoped around **capsulorhexis tracking and surgical-skill assessment**, building on a published benchmark.",
    },
    {
      title: "Xensur Medical",
      note: "I'm **co-building a medical startup**. We've placed well in a few startup competitions this autumn and are preparing for a **pitch final at the end of October**.",
    },
    {
      title: "Listen-Claude",
      note: "I'm giving **Claude's replies a spoken voice**, trained on my own with GPT-SoVITS. This week's fix stops the speech server from popping console windows; readback is paused until I've confirmed it stays quiet.",
    },
    {
      title: "Clip-Claude",
      note: "I'm maintaining a **cross-device clipboard and SSH bridge**. A full audit pass just finished: the clipboard is never left open, file copies no longer flash a console, and idle polling is cheaper. No new features queued.",
    },
    {
      title: "TOEFL sprint",
      note: "I'm on a **16-week TOEFL sprint using my own daily trainer**, 90 minutes a day, with a re-diagnosis in early November and a first sitting planned for early next year.",
      href: "/services/toefl-trainer",
      image: "/now/toefl-sprint.png",
    },
    {
      title: "This site",
      note: "I'm keeping this site as a mount surface for the tools above. The **projects page is now discovered from GitHub topics** instead of a hand-written list, and the TOEFL trainer picked up a phone listening playlist.",
      href: "/projects",
      image: "/now/this-site.png",
    },
  ] satisfies NowItem[],
};
