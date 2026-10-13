import { Header } from "@/components/Header";
import { TrackSection } from "@/components/TrackSection";
import { groupByTrack, loadProjects } from "@/lib/projects";

export const metadata = {
  title: "Projects · puddingsworld",
  description: "A live dashboard of research code, tools, and side projects.",
};

export default async function ProjectsPage() {
  const { fetchedAt, projects } = await loadProjects();
  const tracks = groupByTrack(projects);
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
