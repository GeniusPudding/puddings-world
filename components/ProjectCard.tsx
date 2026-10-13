import Link from "next/link";
import type { Project } from "@/lib/types";
import { formatRelative, repoUrl } from "@/lib/projects";
import { StatusBadge } from "./StatusBadge";

export function ProjectCard({ project }: { project: Project }) {
  const href = repoUrl(project);
  const activity = project.activity;

  return (
    <article className="group relative flex min-w-0 flex-col rounded-xl border border-bg-border bg-bg-panel p-5 transition-colors hover:border-ink-muted has-[a.card-link:focus-visible]:border-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight">
            <Link
              href={`/projects/${project.slug}`}
              className="card-link relative z-10 outline-none transition-colors group-hover:text-accent before:absolute before:inset-0 before:-m-5 before:rounded-xl before:content-['']"
            >
              {project.title}
            </Link>
          </h3>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="relative z-20 mt-0.5 block truncate font-mono text-xs text-ink-muted hover:text-accent"
            >
              {project.repo.owner}/{project.repo.name}
            </a>
          ) : (
            <span className="mt-0.5 block truncate font-mono text-xs text-ink-muted">
              {project.repo.name} · private
            </span>
          )}
        </div>
        <StatusBadge status={project.status} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
        {project.tagline}
      </p>

      {project.paper && (
        <p className="mt-3 truncate font-mono text-xs text-accent">
          📄 {project.paper.title}
        </p>
      )}

      {project.topics.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.topics.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-bg-border bg-bg-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {activity && (
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-bg-border pt-4 text-xs">
          <Metric label="stars" value={activity.stars} />
          <Metric label="issues" value={activity.openIssues} />
          <Metric label="commits/wk" value={activity.weeklyCommits} />
        </dl>
      )}

      {activity?.latestCommit && (
        <div className="mt-3 flex min-w-0 gap-1 text-xs text-ink-muted">
          <span className="shrink-0">
            Last commit{" "}
            <span className="text-ink-secondary">
              {formatRelative(activity.latestCommit.date)}
            </span>
            {" · "}
          </span>
          <span className="min-w-0 truncate font-mono">{activity.latestCommit.message}</span>
        </div>
      )}

      {activity?.latestRelease && (
        <div className="mt-1 text-xs text-ink-muted">
          Latest release{" "}
          <span className="font-mono text-accent-green">{activity.latestRelease.tag}</span>{" "}
          · {formatRelative(activity.latestRelease.date)}
        </div>
      )}

      {project.error && (
        <div className="mt-3 text-xs text-accent-red">activity fetch failed: {project.error}</div>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-ink-primary">{value}</dd>
    </div>
  );
}
