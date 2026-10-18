import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Project, ProjectsSnapshot, Track, TrackSlug } from "./types";

const EMPTY: ProjectsSnapshot = { fetchedAt: null, projects: [] };

export const TRACKS: Record<TrackSlug, { title: string; description: string }> = {
  research: {
    title: "Research",
    description:
      "Code behind papers in progress and the experiments that feed them — biosignals, surgical vision, simulation.",
  },
  tool: {
    title: "Tools",
    description:
      "Digital tools I built because I needed them, then kept polishing because other people did too.",
  },
  side: {
    title: "Side Projects",
    description: "Games, demos, and whatever else was fun enough to finish.",
  },
};

export const TRACK_ORDER: TrackSlug[] = ["research", "tool", "side"];

const LOCAL_IMAGE_EXTS = ["jpg", "png", "webp"];

/**
 * A screenshot dropped at public/projects/<slug>.<ext> becomes the project's
 * image, unless the repo manifest already set one. Lets private repos (whose
 * files the site cannot hotlink) still get a thumbnail.
 */
export function withLocalImages(
  projects: Project[],
  exists: (publicPath: string) => boolean,
): Project[] {
  return projects.map((p) => {
    if (p.image) return p;
    const hit = LOCAL_IMAGE_EXTS.map((ext) => `/projects/${p.slug}.${ext}`).find(exists);
    return hit ? { ...p, image: hit } : p;
  });
}

export async function loadProjects(): Promise<ProjectsSnapshot> {
  try {
    const raw = await readFile(join(process.cwd(), "data", "projects.json"), "utf8");
    const snap = JSON.parse(raw) as ProjectsSnapshot;
    const publicDir = join(process.cwd(), "public");
    return {
      ...snap,
      projects: withLocalImages(snap.projects, (p) => existsSync(join(publicDir, p))),
    };
  } catch {
    return EMPTY;
  }
}

function pushedAt(p: Project): number {
  return p.activity ? new Date(p.activity.pushedAt).getTime() : 0;
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY;
    const bo = b.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return pushedAt(b) - pushedAt(a);
  });
}

export function groupByTrack(projects: Project[]): Track[] {
  return TRACK_ORDER.map((slug) => ({
    slug,
    ...TRACKS[slug],
    projects: sortProjects(projects.filter((p) => p.track === slug)),
  })).filter((t) => t.projects.length > 0);
}

/** One card per track: the manifest-flagged project, else the most recently pushed. */
export function pickFeatured(projects: Project[]): Project[] {
  return TRACK_ORDER.flatMap((slug) => {
    const inTrack = sortProjects(projects.filter((p) => p.track === slug));
    const flagged = inTrack.find((p) => p.featured);
    const pick = flagged ?? inTrack[0];
    return pick ? [pick] : [];
  });
}

export function repoUrl(p: Project): string | undefined {
  return p.repo.private ? undefined : `https://github.com/${p.repo.owner}/${p.repo.name}`;
}

const DAY = 86_400_000;

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const days = Math.round((Date.now() - then) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${(days / 365).toFixed(1)}y ago`;
}
