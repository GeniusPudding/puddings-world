import Link from "next/link";
import type { ActivitySnapshot, Project } from "@/lib/types";
import { repoKey } from "@/lib/activity";
import { StatusBadge } from "./StatusBadge";

const DAY = 1000 * 60 * 60 * 24;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const delta = Date.now() - then;
  if (Number.isNaN(then)) return iso;
  const days = Math.round(delta / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = (days / 365).toFixed(1);
  return `${years}y ago`;
}

export function ProjectCard({
  project,
  activity,
}: {
  project: Project;
  activity: ActivitySnapshot;
}) {
  const repo = project.repo;
  const key = repo ? repoKey(repo.owner, repo.name) : null;
  const repoActivity = key ? activity.repos[key] : undefined;
  const isAnonymous = repo?.anonymous;

  const repoHref = repo
    ? `https://github.com/${repo.owner}/${repo.name}`
    : undefined;

  return (
    <article className="group relative flex flex-col rounded-xl border border-bg-border bg-bg-panel p-5 transition-colors hover:border-ink-muted has-[a.card-link:focus-visible]:border-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            {project.status === "tbd" ? (
              <span>{project.title}</span>
            ) : (
              <Link
                href={`/projects/${project.slug}`}
                className="card-link relative z-10 outline-none transition-colors group-hover:text-accent before:absolute before:inset-0 before:-m-5 before:rounded-xl before:content-['']"
              >
                {project.title}
              </Link>
            )}
          </h3>
          {repo && !isAnonymous && (
            <a
              href={repoHref}
              target="_blank"
              rel="noreferrer"
              className="relative z-20 mt-0.5 block truncate font-mono text-xs text-ink-muted hover:text-accent"
            >
              {repo.owner}/{repo.name}
            </a>
          )}
          {repo && isAnonymous && (
            <span className="mt-0.5 block font-mono text-xs text-ink-muted">
              repo withheld
            </span>
          )}
          {!repo && (
            <span className="mt-0.5 block font-mono text-xs text-ink-muted">
              no repo yet
            </span>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
        {project.tagline}
      </p>

      {project.tags && project.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-bg-border bg-bg-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {repoActivity && !repoActivity.error && (
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-bg-border pt-4 text-xs">
          <Metric label="stars" value={repoActivity.stars} />
          <Metric label="issues" value={repoActivity.openIssues} />
          <Metric label="commits/wk" value={repoActivity.weeklyCommits ?? 0} />
        </dl>
      )}

      {repoActivity?.latestCommit && (
        <div className="mt-3 text-xs text-ink-muted">
          Last commit{" "}
          <span className="text-ink-secondary">
            {formatRelative(repoActivity.latestCommit.date)}
          </span>
          {" · "}
          <span className="truncate font-mono">
            {repoActivity.latestCommit.message.split("\n")[0].slice(0, 60)}
          </span>
        </div>
      )}

      {repoActivity?.latestRelease && (
        <div className="mt-1 text-xs text-ink-muted">
          Latest release{" "}
          <span className="font-mono text-accent-green">
            {repoActivity.latestRelease.tag}
          </span>{" "}
          · {formatRelative(repoActivity.latestRelease.date)}
        </div>
      )}

      {repoActivity?.error && (
        <div className="mt-3 text-xs text-accent-red">
          activity fetch failed: {repoActivity.error}
        </div>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm text-ink-primary">{value}</dd>
    </div>
  );
}
