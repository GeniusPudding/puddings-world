import { Header } from "@/components/Header";
import { TrackSection } from "@/components/TrackSection";
import { tracks } from "@/content/projects";
import { loadActivity } from "@/lib/activity";

export default async function HomePage() {
  const activity = await loadActivity();

  const allProjects = tracks.flatMap((t) => t.projects);
  const liveCount = allProjects.filter((p) => p.status === "active").length;
  const shippedCount = allProjects.filter((p) => p.status === "shipped").length;
  const tbdCount = allProjects.filter((p) => p.status === "tbd").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <Header
        totalProjects={allProjects.length}
        live={liveCount}
        shipped={shippedCount}
        tbd={tbdCount}
        lastFetched={activity.fetchedAt}
      />

      <div className="mt-16 space-y-16">
        {tracks.map((track) => (
          <TrackSection key={track.slug} track={track} activity={activity} />
        ))}
      </div>

      <footer className="mt-24 border-t border-bg-border pt-6 text-xs text-ink-muted">
        Last activity refresh:{" "}
        <span className="font-mono">{activity.fetchedAt ?? "never"}</span>
        {" · "}
        Activity is refreshed weekly via GitHub Actions.
      </footer>
    </main>
  );
}
