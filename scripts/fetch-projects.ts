// Discover every repo tagged with the `puddings-world` topic, merge GitHub
// metadata with an optional `.puddings.json` manifest, attach recent activity
// and write data/projects.json. Runs weekly in GitHub Actions; also runnable
// locally via `pnpm fetch-projects` (set GH_PAT to include private repos).

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { externalProjects } from "../content/external-projects";
import { normalizeProgress } from "../lib/progress";
import { applyPins } from "../lib/projects";
import type {
  Activity,
  Manifest,
  Paper,
  Project,
  ProjectStatus,
  ProjectsSnapshot,
  TrackSlug,
} from "../lib/types";

const MARKER_TOPIC = "puddings-world";
const MANIFEST_PATH = ".puddings.json";
const USER = "GeniusPudding";
// Other accounts whose public repos are scanned for the marker topic.
const EXTRA_ACCOUNTS = ["puddingforhealth", "puddings-world"];
const ACTIVE_WINDOW_DAYS = 90;

const TOKEN = process.env.GH_PAT ?? process.env.GITHUB_TOKEN ?? "";
const API = "https://api.github.com";

const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "puddingsworld-project-fetcher",
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new HttpError(res.status, `GitHub ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function ghOptional<T>(path: string): Promise<T | null> {
  try {
    return await gh<T>(path);
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}

type RepoResponse = {
  name: string;
  owner: { login: string };
  description: string | null;
  homepage: string | null;
  topics: string[];
  private: boolean;
  archived: boolean;
  fork: boolean;
  pushed_at: string;
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
};

type CommitResponse = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { date: string } };
};

type ReleaseResponse = {
  tag_name: string;
  name: string | null;
  published_at: string;
  html_url: string;
};

type ContentResponse = { content: string; encoding: string };

async function paginate(path: string): Promise<RepoResponse[]> {
  const out: RepoResponse[] = [];
  for (let page = 1; page < 20; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const batch = await gh<RepoResponse[]>(`${path}${sep}per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

async function discoverRepos(): Promise<RepoResponse[]> {
  const own = TOKEN
    ? paginate("/user/repos?affiliation=owner,collaborator,organization_member&sort=pushed")
    : paginate(`/users/${USER}/repos?sort=pushed`);
  const repos = (
    await Promise.all([
      own,
      ...EXTRA_ACCOUNTS.map((login) => paginate(`/users/${login}/repos?sort=pushed`)),
    ])
  ).flat();
  const seen = new Set<string>();
  return repos.filter((r) => {
    const key = `${r.owner.login}/${r.name}`;
    if (seen.has(key) || !r.topics.includes(MARKER_TOPIC)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * "owner/name" of the repos pinned on the profile, then on the org, in pin
 * order. GraphQL needs a token; without one nothing counts as pinned.
 */
async function fetchPinned(): Promise<string[]> {
  if (!TOKEN) return [];
  const pins = `pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { nameWithOwner } } }`;
  const query = `{ user(login: "${USER}") { ${pins} } organization(login: "puddings-world") { ${pins} } }`;
  try {
    const res = await fetch(`${API}/graphql`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    });
    type Pins = { pinnedItems: { nodes: { nameWithOwner?: string }[] } } | null;
    const json = (await res.json()) as { data?: { user: Pins; organization: Pins } };
    const names = [json.data?.user, json.data?.organization].flatMap(
      (o) => o?.pinnedItems.nodes.map((n) => n.nameWithOwner) ?? [],
    );
    return [...new Set(names.filter((n): n is string => !!n).map((n) => n.toLowerCase()))];
  } catch (err) {
    console.warn(`  pinned repos unavailable (${String(err)})`);
    return [];
  }
}

async function fetchFile(owner: string, name: string, path: string): Promise<string | null> {
  const res = await ghOptional<ContentResponse>(
    `/repos/${owner}/${name}/contents/${encodeURIComponent(path)}`,
  );
  if (!res || res.encoding !== "base64") return null;
  return Buffer.from(res.content, "base64").toString("utf8");
}

async function fetchManifest(owner: string, name: string): Promise<Manifest> {
  const raw = await fetchFile(owner, name, MANIFEST_PATH);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Manifest;
  } catch (err) {
    console.warn(`  ${owner}/${name}: invalid ${MANIFEST_PATH} (${String(err)})`);
    return {};
  }
}

// Minimal CITATION.cff reader: enough for the top-level scalar fields and the
// `authors` list of `family-names` / `given-names` pairs.
function parseCitation(raw: string): Paper | undefined {
  const scalar = (key: string) => {
    const m = raw.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, "m"));
    return m?.[1];
  };
  const title = scalar("title");
  if (!title) return undefined;
  const dateReleased = scalar("date-released");
  const authors: string[] = [];
  const authorsBlock = raw.match(/^authors:\n((?:[ \t]+.*\n?)+)/m)?.[1] ?? "";
  for (const entry of authorsBlock.split(/\n[ \t]*-/)) {
    const family = entry.match(/family-names:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const given = entry.match(/given-names:\s*["']?(.+?)["']?\s*$/m)?.[1];
    const full = [given, family].filter(Boolean).join(" ");
    if (full) authors.push(full);
  }
  return {
    title,
    authors: authors.length ? authors : undefined,
    doi: scalar("doi"),
    url: scalar("url"),
    year: dateReleased ? Number(dateReleased.slice(0, 4)) : undefined,
  };
}

async function fetchActivity(repo: RepoResponse): Promise<Activity> {
  const { login: owner } = repo.owner;
  const { name } = repo;
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [weekly, latest, release] = await Promise.all([
    gh<CommitResponse[]>(
      `/repos/${owner}/${name}/commits?since=${encodeURIComponent(since)}&per_page=100`,
    ).catch(() => [] as CommitResponse[]),
    gh<CommitResponse[]>(`/repos/${owner}/${name}/commits?per_page=1`).catch(
      () => [] as CommitResponse[],
    ),
    ghOptional<ReleaseResponse>(`/repos/${owner}/${name}/releases/latest`).catch(() => null),
  ]);
  const head = latest[0];
  return {
    stars: repo.stargazers_count,
    openIssues: repo.open_issues_count,
    defaultBranch: repo.default_branch,
    pushedAt: repo.pushed_at,
    weeklyCommits: weekly.length,
    latestCommit: head
      ? {
          sha: head.sha.slice(0, 7),
          message: head.commit.message.split("\n")[0],
          date: head.commit.author.date,
          url: head.html_url,
        }
      : undefined,
    latestRelease: release
      ? {
          tag: release.tag_name,
          name: release.name,
          date: release.published_at,
          url: release.html_url,
        }
      : undefined,
  };
}

function deriveTrack(topics: string[], manifest: Manifest): TrackSlug {
  if (manifest.track) return manifest.track;
  if (topics.includes("research")) return "research";
  if (topics.includes("tool")) return "tool";
  return "side";
}

function deriveStatus(repo: RepoResponse, manifest: Manifest): ProjectStatus {
  if (manifest.status) return manifest.status;
  if (repo.archived) return "archived";
  const ageDays = (Date.now() - new Date(repo.pushed_at).getTime()) / 86_400_000;
  return ageDays <= ACTIVE_WINDOW_DAYS ? "active" : "paused";
}

function resolveImage(repo: RepoResponse, manifest: Manifest): string | undefined {
  const img = manifest.image;
  if (!img) return undefined;
  if (/^https?:\/\//.test(img)) return img;
  if (repo.private) return undefined;
  const rel = img.replace(/^\.?\//, "");
  return `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${repo.default_branch}/${rel}`;
}

const RESERVED_TOPICS = new Set([MARKER_TOPIC, "research", "tool", "side-project"]);

async function buildProject(repo: RepoResponse, manifest: Manifest): Promise<Project> {
  const owner = repo.owner.login;
  const name = repo.name;
  const links = [...(manifest.links ?? [])];
  if (repo.homepage && !links.some((l) => l.href === repo.homepage)) {
    links.unshift({ label: "Live site", href: repo.homepage });
  }
  const project: Project = {
    slug: manifest.slug ?? name.toLowerCase(),
    title: manifest.title ?? name,
    tagline: manifest.tagline ?? repo.description ?? "",
    description: manifest.description,
    track: deriveTrack(repo.topics, manifest),
    status: deriveStatus(repo, manifest),
    repo: { owner, name, private: repo.private },
    topics: repo.topics.filter((t) => !RESERVED_TOPICS.has(t)),
    homepage: repo.homepage || undefined,
    image: resolveImage(repo, manifest),
    imageCaption: manifest.imageCaption,
    links,
    paper: manifest.paper,
    featured: manifest.featured ?? false,
    order: manifest.order,
    progress: normalizeProgress(manifest.progress),
  };
  try {
    const [activity, citation] = await Promise.all([
      fetchActivity(repo),
      project.paper ? Promise.resolve(null) : fetchFile(owner, name, "CITATION.cff"),
    ]);
    project.activity = activity;
    if (citation) project.paper = parseCitation(citation);
  } catch (err) {
    project.error = err instanceof Error ? err.message : String(err);
  }
  return project;
}

async function main() {
  console.log(TOKEN ? "Authenticated." : "No GH_PAT: public repos only, 60 req/h.");
  const discovered = await discoverRepos();
  console.log(`Found ${discovered.length} repo(s) tagged "${MARKER_TOPIC}".`);

  const projects: Project[] = [];

  for (const repo of discovered) {
    const key = `${repo.owner.login}/${repo.name}`;
    process.stdout.write(`  ${key} … `);
    const manifest = await fetchManifest(repo.owner.login, repo.name);
    if (manifest.hidden) {
      console.log("hidden");
      continue;
    }
    const project = await buildProject(repo, manifest);
    projects.push(project);
    console.log(project.error ? `partial (${project.error.slice(0, 60)})` : project.track);
  }

  for (const ext of externalProjects) {
    const key = `${ext.owner}/${ext.name}`;
    process.stdout.write(`  ${key} (external) … `);
    try {
      const repo = await gh<RepoResponse>(`/repos/${key}`);
      const project = await buildProject(repo, ext.manifest);
      projects.push(project);
      console.log(project.error ? `partial (${project.error.slice(0, 60)})` : project.track);
    } catch (err) {
      console.log(`failed (${err instanceof Error ? err.message.slice(0, 60) : String(err)})`);
    }
  }

  const pinned = await fetchPinned();
  console.log(`Pinned: ${pinned.join(", ") || "none"}`);
  const ranked = applyPins(projects, pinned);

  const slugs = new Set<string>();
  for (const p of ranked) {
    if (slugs.has(p.slug)) throw new Error(`Duplicate project slug: ${p.slug}`);
    slugs.add(p.slug);
  }

  const snapshot: ProjectsSnapshot = {
    fetchedAt: new Date().toISOString(),
    projects: ranked,
  };
  const outPath = join(process.cwd(), "data", "projects.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath} (${ranked.length} project(s))`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
