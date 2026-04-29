import type { ProjectStatus } from "@/lib/types";

const STYLES: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: "active",
    className: "border-accent-green/40 bg-accent-green/10 text-accent-green",
  },
  paused: {
    label: "paused",
    className: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  },
  shipped: {
    label: "shipped",
    className: "border-accent/40 bg-accent/10 text-accent",
  },
  tbd: {
    label: "tbd",
    className: "border-bg-border bg-bg-raised text-ink-muted",
  },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${s.className}`}
    >
      {s.label}
    </span>
  );
}
