import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectProgress } from "@/components/ProjectProgress";
import { ProjectVisual } from "@/components/ProjectVisual";
import { StatusBadge } from "@/components/StatusBadge";
import {
  TRACKS,
  formatRelative,
  groupByTrack,
  loadProjects,
  repoUrl,
} from "@/lib/projects";

async function orderedProjects() {
  const { projects } = await loadProjects();
  return groupByTrack(projects).flatMap((t) => t.projects);
}

export async function generateStaticParams() {
  return (await orderedProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = (await orderedProjects()).find((p) => p.slug === slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.tagline,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const all = await orderedProjects();
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) notFound();

  const project = all[idx];
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;
  const activity = project.activity;
  const href = repoUrl(project);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/projects"
        className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
      >
        ← projects
      </Link>

      <header className="mt-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          {TRACKS[project.track].title}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <StatusBadge status={project.status} />
        </div>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
          {project.tagline}
        </p>
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
      </header>

      {project.image && (
        <div className="mt-10">
          <ProjectVisual
            src={project.image}
            caption={project.imageCaption}
            title={project.title}
          />
        </div>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_280px]">
        <article className="space-y-4 text-base leading-relaxed text-ink-secondary">
          {project.description ? (
            project.description
              .split(/\n\n+/)
              .map((para, i) => <p key={i}>{para}</p>)
          ) : (
            <p className="text-ink-muted">
              No long description yet — the repo&apos;s own README has the details.
            </p>
          )}
          {project.progress && <ProjectProgress milestones={project.progress} />}
        </article>

        <aside className="space-y-6">
          {project.paper && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Paper
              </h2>
              <p className="mt-2 text-sm font-medium leading-snug text-ink-primary">
                {project.paper.title}
              </p>
              {project.paper.authors && (
                <p className="mt-1 text-xs text-ink-secondary">
                  {project.paper.authors.join(", ")}
                </p>
              )}
              {(project.paper.venue || project.paper.year) && (
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {[project.paper.venue, project.paper.year].filter(Boolean).join(" · ")}
                </p>
              )}
              {(project.paper.doi || project.paper.url) && (
                <a
                  href={
                    project.paper.doi
                      ? `https://doi.org/${project.paper.doi}`
                      : project.paper.url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block break-all font-mono text-xs text-accent hover:underline"
                >
                  {project.paper.doi ? `doi:${project.paper.doi}` : "Read ↗"}
                </a>
              )}
            </div>
          )}

          <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
            <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
              Repository
            </h2>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all font-mono text-sm text-accent hover:underline"
              >
                {project.repo.owner}/{project.repo.name} ↗
              </a>
            ) : (
              <p className="mt-2 font-mono text-sm text-ink-muted">
                {project.repo.name} · private
              </p>
            )}
          </div>

          {activity && (
            <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Activity
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label="Stars" value={activity.stars} />
                <Row label="Open issues" value={activity.openIssues} />
                <Row label="Commits / wk" value={activity.weeklyCommits} />
                {activity.latestCommit && (
                  <Row label="Last commit" value={formatRelative(activity.latestCommit.date)} />
                )}
                {activity.latestRelease && (
                  <Row
                    label="Latest release"
                    value={`${activity.latestRelease.tag} · ${formatRelative(
                      activity.latestRelease.date,
                    )}`}
                  />
                )}
              </dl>
            </div>
          )}

          {project.links.length > 0 && (
            <div className="rounded-xl border border-bg-border bg-bg-panel p-5">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">
                Links
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {project.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="break-all text-accent hover:underline"
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

      <nav className="mt-16 flex items-center justify-between gap-4 border-t border-bg-border pt-6 text-sm">
        {prev ? (
          <Link
            href={`/projects/${prev.slug}`}
            className="min-w-0 truncate text-ink-muted transition-colors hover:text-accent"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/projects/${next.slug}`}
            className="min-w-0 truncate text-right text-ink-muted transition-colors hover:text-accent"
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
