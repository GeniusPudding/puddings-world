export type ProjectStatus = "active" | "paused" | "shipped" | "tbd";

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  /** Long-form description shown on the project detail page. Markdown not parsed; render as paragraphs. */
  description?: string;
  /** Path under /public for the project's hero / visualization image, e.g. "/projects/foo.png". */
  image?: string;
  /** One-line caption shown under the image. Helpful when the image is a diagram or screenshot. */
  imageCaption?: string;
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
