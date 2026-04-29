import type { ActivitySnapshot, Track } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

export function TrackSection({
  track,
  activity,
}: {
  track: Track;
  activity: ActivitySnapshot;
}) {
  return (
    <section aria-labelledby={`track-${track.slug}`}>
      <div className="mb-6 flex items-baseline justify-between border-b border-bg-border pb-3">
        <h2
          id={`track-${track.slug}`}
          className="text-xl font-semibold tracking-tight"
        >
          {track.title}
        </h2>
        <span className="font-mono text-xs text-ink-muted">
          {track.projects.length} project{track.projects.length === 1 ? "" : "s"}
        </span>
      </div>
      {track.description && (
        <p className="mb-6 max-w-3xl text-sm text-ink-secondary">
          {track.description}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {track.projects.map((project) => (
          <ProjectCard
            key={project.slug}
            project={project}
            activity={activity}
          />
        ))}
      </div>
    </section>
  );
}
