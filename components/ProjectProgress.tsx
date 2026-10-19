import { progressSummary } from "@/lib/progress";
import type { Milestone } from "@/lib/types";

const MARK: Record<Milestone["status"], { icon: string; className: string; label: string }> = {
  done: { icon: "✓", className: "border-accent-green/50 text-accent-green", label: "done" },
  doing: { icon: "●", className: "border-accent/60 text-accent", label: "in progress" },
  next: { icon: "○", className: "border-bg-border text-ink-muted", label: "planned" },
};

export function ProgressBar({ milestones }: { milestones: Milestone[] }) {
  const { done, total } = progressSummary(milestones);
  return (
    <div className="flex items-center gap-2" title={`${done} of ${total} milestones done`}>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-bg-raised">
        <div className="h-full rounded-full bg-accent-green/70" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <span className="shrink-0 font-mono text-[10px] text-ink-muted">
        {done}/{total}
      </span>
    </div>
  );
}

export function ProjectProgress({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-muted">Progress</h2>
      </div>
      <div className="mt-3 max-w-md">
        <ProgressBar milestones={milestones} />
      </div>
      <ol className="mt-5 space-y-3">
        {milestones.map((m, i) => {
          const mark = MARK[m.status];
          return (
            <li key={i} className="flex gap-3">
              <span
                aria-label={mark.label}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${mark.className}`}
              >
                {mark.icon}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-sm ${m.status === "next" ? "text-ink-muted" : "text-ink-primary"}`}
                >
                  {m.title}
                </p>
                {m.note && <p className="mt-0.5 text-xs text-ink-muted">{m.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
