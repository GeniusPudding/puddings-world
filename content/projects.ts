import type { Track } from "@/lib/types";

// ---------------------------------------------------------------------------
// TODO: split `unassigned` into your actual research tracks.
// Create new Track entries below and move projects between them. Suggested
// pattern: one track = one long-running thread (e.g. "Biosignal AI",
// "Surgical Perception", "Audio Generation", "Android Tooling"). Leave the
// `tbd` placeholders as-is until their real repos exist.
// ---------------------------------------------------------------------------

export const tracks: Track[] = [
  {
    slug: "unassigned",
    title: "Unassigned — please split into your tracks",
    description:
      "All projects start here. Rename this track and add new Track objects in content/projects.ts to group them by research theme.",
    projects: [
      {
        slug: "epg-data-analyzer",
        title: "EPG Data Analyzer",
        tagline: "Electropulsegraphy signal analysis pipeline.",
        repo: { owner: "jamesforhealth", name: "EPG_data_analyzer" },
        status: "active",
        tags: ["biosignal", "python"],
      },
      {
        slug: "surgery-ocr",
        title: "SurgeryOCR",
        tagline: "OCR for surgical video overlays and device displays.",
        repo: { owner: "jamesforhealth", name: "SurgeryOCR" },
        status: "active",
        tags: ["vision", "ocr", "surgery"],
      },
      {
        slug: "neural-kelvinlet",
        title: "Neural Kelvinlet",
        tagline: "Learned Kelvinlet deformation fields for soft-tissue sims.",
        repo: { owner: "Anon92373", name: "Neural-Kelvinlet", anonymous: true },
        status: "active",
        tags: ["physics-ml", "simulation"],
      },
      {
        slug: "sofa-tearing",
        title: "SofaTearing",
        tagline: "Tearing/fracture extensions for the SOFA FEM framework.",
        repo: { owner: "JaggerYu928", name: "SofaTearing" },
        status: "active",
        tags: ["fem", "simulation", "c++"],
      },
      {
        slug: "catar-homepage",
        title: "CatAR Homepage",
        tagline: "Landing site for the CatAR project.",
        repo: { owner: "jaggerturkey", name: "CatAR_homepage" },
        status: "shipped",
        tags: ["web", "ar"],
      },
      {
        slug: "invisible-go",
        title: "InvisibleGo",
        tagline: "Blind / partially-observable Go variant with an AI opponent.",
        repo: { owner: "GeniusPudding", name: "InvisibleGo" },
        status: "active",
        tags: ["game", "rl"],
      },
      {
        slug: "reprise-studio",
        title: "Reprise Studio",
        tagline: "Creative audio/music production tooling.",
        repo: { owner: "GeniusPudding", name: "reprise-studio" },
        status: "active",
        tags: ["audio", "tooling"],
      },
      {
        slug: "kaikou-claude",
        title: "Kaikou (claude-voice-zh)",
        tagline: "Traditional-Chinese voice bridge for Claude Code.",
        repo: { owner: "GeniusPudding", name: "Kaikou-Claude" },
        links: [{ label: "Local folder", href: "claude-voice-zh" }],
        status: "active",
        tags: ["voice", "claude-code", "zh-tw"],
      },
      {
        slug: "sadroid",
        title: "SADroid",
        tagline: "Android static-analysis tooling.",
        repo: { owner: "GeniusPudding", name: "SADroid" },
        status: "paused",
        tags: ["android", "security"],
      },
      {
        slug: "apksmith",
        title: "ApkSmith",
        tagline: "APK inspection / modification helper.",
        repo: { owner: "GeniusPudding", name: "ApkSmith" },
        status: "paused",
        tags: ["android", "tooling"],
      },

      // --- TBD slots (no public repo yet — fill in when ready) --------------
      {
        slug: "tbd-next-idea",
        title: "TBD — next research thread",
        tagline: "Placeholder. Replace with real project once a repo exists.",
        status: "tbd",
      },
      {
        slug: "tbd-side-tool",
        title: "TBD — side tool",
        tagline: "Placeholder for the next small utility.",
        status: "tbd",
      },
    ],
  },
];
