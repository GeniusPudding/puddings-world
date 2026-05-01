import type { Track } from "@/lib/types";

// ---------------------------------------------------------------------------
// TODO: split `unassigned` into your actual research tracks.
// Create new Track entries below and move projects between them. Suggested
// pattern: one track = one long-running thread (e.g. "Biosignal AI",
// "Surgical Perception", "Audio Generation", "Android Tooling"). Leave the
// `tbd` placeholders as-is until their real repos exist.
//
// To add a hero image to a project, drop a file in
//   public/projects/<slug>.png  (or .jpg / .svg)
// and set `image: "/projects/<slug>.png"` on that entry.
// ---------------------------------------------------------------------------

export const tracks: Track[] = [
  {
    slug: "unassigned",
    title: "Unassigned — please split into your tracks",
    description:
      "All projects start here. Rename this track and add new Track objects in content/projects.ts to group them by research theme.",
    projects: [
      {
        slug: "flowfusion-bp",
        title: "FlowFusionBP",
        tagline: "Real-time blood-pressure prediction from wearable sensor fusion.",
        description:
          "Predicts blood pressure in real time by fusing features across multiple wearable signal channels and inferring from just a few seconds of input — aimed at always-on, cuffless monitoring scenarios where neither cuff inflation nor minute-long calibration is acceptable. TODO: link the experimental setup, swap in real accuracy numbers, and explain the multi-channel architecture.",
        repo: { owner: "puddingforhealth", name: "FlowFusionBP" },
        status: "active",
        tags: ["biosignal", "blood-pressure", "wearables", "python"],
      },
      {
        slug: "epg-latentflow",
        title: "EPG-LatentFlow",
        tagline: "Representation learning over EPG pulse-wave signals.",
        description:
          "Learned latent embeddings of pulse-wave signals captured with FlowEHealth's proprietary EPG sensing technology. Replaces hand-engineered features with representations that downstream tasks (BP estimation, rhythm classification, anomaly detection) can build on. TODO: clarify pretraining objective, dataset, and which downstream tasks the embeddings have actually been benchmarked on.",
        repo: { owner: "puddingforhealth", name: "EPG-LatentFlow" },
        status: "active",
        tags: ["biosignal", "representation-learning", "epg", "python"],
      },
      {
        slug: "ppg-pulseflowbp",
        title: "PPG-PulseFlowBP",
        tagline: "Cuffless BP prediction from PPG, with serious data hygiene.",
        description:
          "Cuffless blood-pressure prediction from PPG signals, with a heavy emphasis on cleaning the PulseDB dataset before any modelling — many cuffless-BP papers skip this and over-claim accuracy on noisy ground truth. The repo establishes the data-cleaning baseline first, then layers experimental models on top. TODO: separate the cleaning utilities from the experimental model code, and document the exact subset of PulseDB that survived filtering.",
        repo: { owner: "puddingforhealth", name: "PPG-PulseFlowBP" },
        status: "active",
        tags: ["biosignal", "blood-pressure", "ppg", "python"],
      },
      {
        slug: "surgery-ocr",
        title: "SurgeryOCR",
        tagline: "OCR for ophthalmological surgical video overlays.",
        description:
          "Reads numerical readouts (device parameters, timings, settings) directly off ophthalmological surgical video — useful when raw device telemetry isn't recorded but the screen is. Combines region detection with a small recognizer trained on the fonts surgical equipment actually uses. TODO: refine with real accuracy numbers, the dataset story, and a frame-level demo gif.",
        repo: { owner: "puddingforhealth", name: "SurgeryOCR" },
        status: "active",
        tags: ["vision", "ocr", "surgery", "python"],
      },
      {
        slug: "sofa-tearing",
        title: "SofaTearing",
        tagline: "Tearing/fracture extensions for the SOFA FEM framework.",
        description:
          "Extensions to the SOFA finite-element framework that introduce dynamic tearing and fracture along material boundaries during simulation. Aimed at soft-tissue surgical training scenarios where realistic mesh separation matters. TODO: add the concrete fracture criterion you implemented and a screenshot of a torn mesh.",
        repo: { owner: "JaggerYu928", name: "SofaTearing" },
        status: "active",
        tags: ["fem", "simulation", "c++"],
      },
      {
        slug: "catar-homepage",
        title: "CatAR Homepage",
        tagline: "Landing site for the CatAR project.",
        description:
          "Marketing / informational landing page for CatAR, an augmented-reality experience. Static site, lightweight stack. TODO: link to the actual CatAR app and add a short blurb on what CatAR is.",
        repo: { owner: "jaggerturkey", name: "CatAR_homepage" },
        status: "shipped",
        tags: ["web", "ar"],
      },
      {
        slug: "invisible-go",
        title: "InvisibleGo",
        tagline: "Blind / partially-observable Go variant with an AI opponent.",
        description:
          "A Go variant where players see only a subset of the board — partial observability turns a perfect-information game into something closer to poker. The project explores how reinforcement-learning agents adapt to hidden-state Go, and includes a playable interface for humans to challenge the trained agent. TODO: link a demo session, document the observation model, drop in the win-rate plot.",
        repo: { owner: "GeniusPudding", name: "InvisibleGo" },
        status: "active",
        tags: ["game", "rl"],
      },
      {
        slug: "reprise-studio",
        title: "Reprise Studio",
        tagline: "Creative audio/music production tooling.",
        description:
          "Tooling for music creators — taking ideas from rough capture to a finished arrangement faster, with model-assisted editing where it actually helps and out of the way where it doesn't. TODO: nail down what the v1 actually ships (DAW plugin? standalone? web?) and write the description around that.",
        repo: { owner: "GeniusPudding", name: "reprise-studio" },
        status: "active",
        tags: ["audio", "tooling"],
      },
      {
        slug: "kaikou-claude",
        title: "Kaikou (claude-voice-zh)",
        tagline: "Traditional-Chinese voice bridge for Claude Code.",
        description:
          "A voice bridge that lets you drive Claude Code in Traditional Chinese — speak instructions, hear responses, in zh-TW. Targets developers and analysts who think faster in Chinese than they type. TODO: confirm the architecture (local STT/TTS vs. cloud), screenshot or short demo gif.",
        repo: { owner: "GeniusPudding", name: "Kaikou-Claude" },
        links: [{ label: "Local folder", href: "claude-voice-zh" }],
        status: "active",
        tags: ["voice", "claude-code", "zh-tw"],
      },
      {
        slug: "sadroid",
        title: "SADroid",
        tagline: "Android static-analysis tooling.",
        description:
          "Static-analysis tooling for Android applications — surfaces permission misuse, suspect API calls, and structural issues in APKs without running them. Currently paused; reachable for resurrection if a clear use case shows up. TODO: list the analyses it actually performs.",
        repo: { owner: "GeniusPudding", name: "SADroid" },
        status: "paused",
        tags: ["android", "security"],
      },
      {
        slug: "apksmith",
        title: "ApkSmith",
        tagline: "APK inspection / modification helper.",
        description:
          "A helper for inspecting and modifying APK files — unpack, edit resources/manifests, repack and resign. Companion piece to SADroid. Currently paused. TODO: clarify scope vs. existing tools like apktool / apksigner.",
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
