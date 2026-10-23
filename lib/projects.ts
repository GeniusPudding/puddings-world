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

/** Manifest order, then GitHub pins, then featured, then most recently pushed. */
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY;
    const bo = b.order ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    const ap = a.pinned ?? Number.POSITIVE_INFINITY;
    const bp = b.pinned ?? Number.POSITIVE_INFINITY;
    if (ap !== bp) return ap - bp;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return pushedAt(b) - pushedAt(a);
  });
}

/** Marks each project by its repo's place in the pinned list ("owner/name"). */
export function applyPins(projects: Project[], pinned: string[]): Project[] {
  const rank = new Map(pinned.map((n, i) => [n.toLowerCase(), i]));
  return projects.map((p) => {
    const { pinned: _, ...rest } = p;
    const r = rank.get(`${p.repo.owner}/${p.repo.name}`.toLowerCase());
    return r === undefined ? rest : { ...rest, pinned: r };
  });
}

export const SPOTLIGHT_RECENT = 3;
export const SPOTLIGHT_WINDOW_DAYS = 30;

/**
 * The row above the tracks: everything pinned on GitHub in pin order, then
 * the few other projects pushed to most recently within the window.
 */
export function spotlight(projects: Project[], now = Date.now()): Project[] {
  const pinned = projects
    .filter((p) => p.pinned !== undefined)
    .sort((a, b) => a.pinned! - b.pinned!);
  const recent = projects
    .filter((p) => p.pinned === undefined && now - pushedAt(p) <= SPOTLIGHT_WINDOW_DAYS * DAY)
    .sort((a, b) => pushedAt(b) - pushedAt(a))
    .slice(0, SPOTLIGHT_RECENT);
  return [...pinned, ...recent];
}

export function groupByTrack(projects: Project[]): Track[] {
  return TRACK_ORDER.map((slug) => ({
    slug,
    ...TRACKS[slug],
    projects: sortProjects(projects.filter((p) => p.track === slug)),
  })).filter((t) => t.projects.length > 0);
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
