import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectVisual } from "@/components/ProjectVisual";
import { StatusBadge } from "@/components/StatusBadge";
import { tracks } from "@/content/projects";
import { loadActivity, repoKey } from "@/lib/activity";
import type { Project } from "@/lib/types";

const flatProjects: Project[] = tracks.flatMap((t) => t.projects);

export function generateStaticParams() {
  return flatProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = flatProjects.find((p) => p.slug === slug);
  if (!project) return { title: "Project not found" };
  return {
    title: `${project.title} · puddingsworld`,
    description: project.tagline,
  };
}

const DAY = 1000 * 60 * 60 * 24;
function formatRelative(iso: string): string {
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

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const idx = flatProjects.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();

  const project = flatProjects[idx];
  const prev = idx > 0 ? flatProjects[idx - 1] : null;
  const next = idx < flatProjects.length - 1 ? flatProjects[idx + 1] : null;

  const activity = await loadActivity();
  const repoActivity = project.repo
    ? activity.repos[repoKey(project.repo.owner, project.repo.name)]
    : undefined;

  const repoHref =
    project.repo && !project.repo.anonymous
      ? `https://github.com/${project.repo.owner}/${project.repo.name}`
      : undefined;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link
        href="/projects"
        className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
      >
        ← projects
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
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
      </header>

      <div className="mt-10">
        <ProjectVisual
          src={project.image}
          caption={project.imageCaption}
          title={project.title}
          slug={project.slug}
        />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_280px]">
        <article className="space-y-4 text-base leading-relaxed text-ink-secondary">
          {project.description ? (
            project.description.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))
          ) : (
            <p className="text-ink-muted">
              No long description yet. Add one in{" "}
              <code className="rounded bg-bg-raised px-1 font-mono">
                content/projects.ts
              </code>
              .
            </p>
          )}
        </article>

        <aside className="space-y-6">
          {project.repo && (
            <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Repository
              </h2>
              {repoHref ? (
                <a
                  href={repoHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all font-mono text-sm text-accent hover:underline"
                >
                  {project.repo.owner}/{project.repo.name} ↗
                </a>
              ) : (
                <p className="mt-2 font-mono text-sm text-ink-muted">
                  withheld
                </p>
              )}
            </div>
          )}

          {repoActivity && !repoActivity.error && (
            <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Activity
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Stars" value={repoActivity.stars} />
                <Row label="Open issues" value={repoActivity.openIssues} />
                <Row label="Commits / wk" value={repoActivity.weeklyCommits ?? 0} />
                {repoActivity.latestCommit && (
                  <Row
                    label="Last commit"
                    value={formatRelative(repoActivity.latestCommit.date)}
                  />
                )}
                {repoActivity.latestRelease && (
                  <Row
                    label="Latest release"
                    value={`${repoActivity.latestRelease.tag} · ${formatRelative(
                      repoActivity.latestRelease.date,
                    )}`}
                  />
                )}
              </dl>
            </div>
          )}

          {project.links && project.links.length > 0 && (
            <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Links
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {project.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-accent hover:underline"
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      → {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <nav className="mt-16 flex items-center justify-between border-t border-bg-border pt-6 text-sm">
        {prev ? (
          <Link
            href={`/projects/${prev.slug}`}
            className="text-ink-muted transition-colors hover:text-accent"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/projects/${next.slug}`}
            className="text-right text-ink-muted transition-colors hover:text-accent"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-mono text-ink-primary">{value}</dd>
    </div>
  );
}
