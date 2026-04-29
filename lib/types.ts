export type ProjectStatus = "active" | "paused" | "shipped" | "tbd";

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description?: string;
  repo?: {
    owner: string;
    name: string;
    /** Hide the owner handle in the UI (e.g. anonymous submission accounts). */
    anonymous?: boolean;
  };
  links?: { label: string; href: string }[];
  tags?: string[];
  status: ProjectStatus;
};

export type Track = {
  slug: string;
  title: string;
  description?: string;
  projects: Project[];
};

export type RepoActivity = {
  owner: string;
  name: string;
  stars: number;
  openIssues: number;
  defaultBranch: string;
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
  weeklyCommits?: number;
  error?: string;
};

export type ActivitySnapshot = {
  fetchedAt: string | null;
  repos: Record<string, RepoActivity>;
};
