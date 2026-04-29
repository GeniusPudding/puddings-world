// Fetch live activity for every project repo and write data/activity.json.
// Runs weekly in GitHub Actions; also runnable locally via `npm run fetch-activity`.
//
// Auth: set GH_PAT to a GitHub token with public-repo read access. Without it
// we use the anonymous 60 req/hour quota, which is enough for ~10 repos.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tracks } from "../content/projects";
import type { ActivitySnapshot, RepoActivity } from "../lib/types";

const TOKEN = process.env.GH_PAT ?? process.env.GITHUB_TOKEN ?? "";
const API = "https://api.github.com";

type Headers = Record<string, string>;

const headers: Headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "puddingsworld-activity-fetcher",
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function gh<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

type RepoResponse = {
  stargazers_count: number;
  open_issues_count: number;
  default_branch: string;
  message?: string;
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

async function fetchRepoActivity(owner: string, name: string): Promise<RepoActivity> {
  const base: RepoActivity = {
    owner,
    name,
    stars: 0,
    openIssues: 0,
    defaultBranch: "main",
  };
  try {
    const repo = await gh<RepoResponse>(`/repos/${owner}/${name}`);
    base.stars = repo.stargazers_count;
    base.openIssues = repo.open_issues_count;
    base.defaultBranch = repo.default_branch;

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const [commits, latestCommitArr] = await Promise.all([
      gh<CommitResponse[]>(
        `/repos/${owner}/${name}/commits?since=${encodeURIComponent(since)}&per_page=100`,
      ).catch(() => [] as CommitResponse[]),
      gh<CommitResponse[]>(`/repos/${owner}/${name}/commits?per_page=1`).catch(
        () => [] as CommitResponse[],
      ),
    ]);

    base.weeklyCommits = commits.length;
    const latest = latestCommitArr[0];
    if (latest) {
      base.latestCommit = {
        sha: latest.sha.slice(0, 7),
        message: latest.commit.message,
        date: latest.commit.author.date,
        url: latest.html_url,
      };
    }

    const release = await gh<ReleaseResponse>(
      `/repos/${owner}/${name}/releases/latest`,
    ).catch(() => null);
    if (release) {
      base.latestRelease = {
        tag: release.tag_name,
        name: release.name,
        date: release.published_at,
        url: release.html_url,
      };
    }
  } catch (err) {
    base.error = err instanceof Error ? err.message : String(err);
  }
  return base;
}

async function main() {
  const repos = tracks
    .flatMap((t) => t.projects)
    .map((p) => p.repo)
    .filter((r): r is NonNullable<typeof r> => !!r);

  const unique = new Map<string, (typeof repos)[number]>();
  for (const r of repos) unique.set(`${r.owner}/${r.name}`, r);

  console.log(`Fetching activity for ${unique.size} repo(s)…`);
  const snapshot: ActivitySnapshot = {
    fetchedAt: new Date().toISOString(),
    repos: {},
  };

  for (const r of unique.values()) {
    const key = `${r.owner}/${r.name}`;
    process.stdout.write(`  ${key} … `);
    const data = await fetchRepoActivity(r.owner, r.name);
    snapshot.repos[key] = data;
    console.log(data.error ? `failed (${data.error.slice(0, 60)})` : "ok");
  }

  const outPath = join(process.cwd(), "data", "activity.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
