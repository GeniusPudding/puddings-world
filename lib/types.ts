export type TrackSlug = "research" | "tool" | "side";

export type ProjectStatus = "active" | "paused" | "shipped" | "archived";

export type Paper = {
  title: string;
  authors?: string[];
  venue?: string;
  year?: number;
  doi?: string;
  url?: string;
};

export type ProjectLink = { label: string; href: string };

export type MilestoneStatus = "done" | "doing" | "next";

/** One step of a project's public roadmap. */
export type Milestone = { title: string; status: MilestoneStatus; note?: string };

/**
 * Optional `.puddings.json` at a repo root. Every field overrides what the
 * fetcher derives from GitHub metadata. Treat the contents as public copy,
 * even on private repos: the site publishes them.
 */
export type Manifest = {
  slug?: string;
  title?: string;
  tagline?: string;
  /** Long-form description. Paragraphs separated by blank lines. */
  description?: string;
  track?: TrackSlug;
  status?: ProjectStatus;
  /** Repo-relative path or absolute URL for the hero image. */
  image?: string;
  imageCaption?: string;
  links?: ProjectLink[];
  paper?: Paper;
  featured?: boolean;
  /** Keep the repo out of the site without removing the topic. */
  hidden?: boolean;
  /** Lower sorts first inside its track. Defaults to recency. */
  order?: number;
  /** Public roadmap, oldest step first. Shown even when the repo is private. */
  progress?: Milestone[];
};

export type Activity = {
  stars: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string;
  weeklyCommits: number;
  latestCommit?: {
    sha: string;
    message: string;
    date: string;
    url: string;
  };
  latestRelease?: {
    tag: string;
    name: string | null;
    date: string;
    url: string;
  };
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description?: string;
  track: TrackSlug;
  status: ProjectStatus;
  repo: { owner: string; name: string; private: boolean };
  topics: string[];
  homepage?: string;
  image?: string;
  imageCaption?: string;
  links: ProjectLink[];
  paper?: Paper;
  featured: boolean;
  order?: number;
  /** Position among the repos pinned on the GitHub profile, 0 first. */
  pinned?: number;
  progress?: Milestone[];
  activity?: Activity;
  error?: string;
};

export type ProjectsSnapshot = {
  fetchedAt: string | null;
  projects: Project[];
};

export type Track = {
  slug: TrackSlug;
  title: string;
  description: string;
  projects: Project[];
};
