import type { Manifest } from "@/lib/types";

// Repos this GitHub account cannot write to (other owners, or the
// puddingforhealth org where it is not a member), so it cannot tag them with
// the `puddings-world` topic or add a manifest. Everything else is discovered
// from GitHub topics — see scripts/fetch-projects.ts. Once a repo here gets
// the topic from an account that can, delete its entry.

export type ExternalProject = {
  owner: string;
  name: string;
  manifest: Manifest & { track: Manifest["track"] };
};

export const externalProjects: ExternalProject[] = [
  {
    owner: "puddingforhealth",
    name: "FlowFusionBP",
    manifest: {
      track: "research",
      featured: true,
      tagline: "Real-time blood-pressure prediction from wearable sensor fusion.",
      description:
        "Predicts blood pressure in real time by fusing features across multiple wearable signal channels and inferring from just a few seconds of input — aimed at always-on, cuffless monitoring scenarios where neither cuff inflation nor minute-long calibration is acceptable.",
    },
  },
  {
    owner: "puddingforhealth",
    name: "EPG-LatentFlow",
    manifest: {
      track: "research",
      tagline: "Representation learning over EPG pulse-wave signals.",
      description:
        "Learned latent embeddings of pulse-wave signals captured with FlowEHealth's proprietary EPG sensing technology. Replaces hand-engineered features with representations that downstream tasks (BP estimation, rhythm classification, anomaly detection) can build on.",
    },
  },
  {
    owner: "puddingforhealth",
    name: "PPG-PulseFlowBP",
    manifest: {
      track: "research",
      tagline: "Cuffless BP prediction from PPG, with serious data hygiene.",
      description:
        "Cuffless blood-pressure prediction from PPG signals, with a heavy emphasis on cleaning the PulseDB dataset before any modelling — many cuffless-BP papers skip this and over-claim accuracy on noisy ground truth. The repo establishes the data-cleaning baseline first, then layers experimental models on top.",
    },
  },
  {
    owner: "puddingforhealth",
    name: "SurgeryOCR",
    manifest: {
      track: "research",
      tagline: "OCR for ophthalmological surgical video overlays.",
      description:
        "Reads numerical readouts (device parameters, timings, settings) directly off ophthalmological surgical video — useful when raw device telemetry isn't recorded but the screen is. Combines region detection with a small recognizer trained on the fonts surgical equipment actually uses.",
    },
  },
  {
    owner: "JaggerYu928",
    name: "SofaTearing",
    manifest: {
      track: "research",
      tagline: "Tearing/fracture extensions for the SOFA FEM framework.",
      description:
        "Extensions to the SOFA finite-element framework that introduce dynamic tearing and fracture along material boundaries during simulation. Aimed at soft-tissue surgical training scenarios where realistic mesh separation matters.",
    },
  },
  {
    owner: "jaggerturkey",
    name: "CatAR_homepage",
    manifest: {
      track: "side",
      title: "CatAR Homepage",
      status: "shipped",
      tagline: "Landing site for the CatAR project.",
      description:
        "Marketing / informational landing page for CatAR, an augmented-reality experience. Static site, lightweight stack.",
    },
  },
];
