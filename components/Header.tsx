type Props = {
  totalProjects: number;
  live: number;
  shipped: number;
  tbd: number;
  lastFetched: string | null;
};

export function Header({ totalProjects, live, shipped, tbd, lastFetched }: Props) {
  return (
    <header>
      <div className="flex items-baseline gap-3">
        <h1 className="font-mono text-3xl font-semibold tracking-tight">puddingsworld</h1>
        <span className="text-sm text-ink-muted">/ R&D dashboard</span>
      </div>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
        A running tab of what I&apos;m building. Project metadata is authored
        by hand; GitHub activity is refreshed weekly by a scheduled job.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Projects" value={totalProjects} />
        <Stat label="Active" value={live} accent="green" />
        <Stat label="Shipped" value={shipped} accent="blue" />
        <Stat label="TBD" value={tbd} accent="muted" />
      </dl>
    </header>
  );
}

function Stat({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "green" | "blue" | "muted";
}) {
  const color =
    accent === "green"
      ? "text-accent-green"
      : accent === "blue"
      ? "text-accent"
      : accent === "muted"
      ? "text-ink-muted"
      : "text-ink-primary";
  return (
    <div className="rounded-lg border border-bg-border bg-bg-panel px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-ink-muted">{label}</dt>
      <dd className={`mt-1 font-mono text-2xl ${color}`}>{value}</dd>
    </div>
  );
}
