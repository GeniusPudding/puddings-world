import { Header } from "@/components/Header";
import { ProjectCard } from "@/components/ProjectCard";
import { TrackSection } from "@/components/TrackSection";
import { groupByTrack, loadProjects, spotlight } from "@/lib/projects";

export const metadata = {
  title: "Projects · puddingsworld",
  description: "A live dashboard of research code, tools, and side projects.",
};

export default async function ProjectsPage() {
  const { fetchedAt, projects } = await loadProjects();
  const tracks = groupByTrack(projects);
  const upFront = spotlight(projects);
  const liveCount = projects.filter((p) => p.status === "active").length;
  const shippedCount = projects.filter((p) => p.status === "shipped").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Header
        totalProjects={projects.length}
        live={liveCount}
        shipped={shippedCount}
        lastFetched={fetchedAt}
      />

      {upFront.length > 0 && (
        <section aria-labelledby="spotlight" className="mt-16">
          <div className="mb-6 flex items-baseline justify-between border-b border-bg-border pb-3">
            <h2 id="spotlight" className="text-xl font-semibold tracking-tight">
              Pinned &amp; recently active
            </h2>
            <span className="font-mono text-xs text-ink-muted">from GitHub</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upFront.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16 space-y-16">
        {tracks.map((track) => (
          <TrackSection key={track.slug} track={track} />
        ))}
      </div>

      <footer className="mt-24 border-t border-bg-border pt-6 text-xs text-ink-muted">
        Last refresh: <span className="font-mono">{fetchedAt ?? "never"}</span>
        {" · "}
        Weekly via GitHub Actions.
      </footer>
    </main>
  );
}
