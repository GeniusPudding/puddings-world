type Props = {
  totalProjects: number;
  live: number;
  shipped: number;
  lastFetched: string | null;
};

export function Header({ totalProjects, live, shipped, lastFetched }: Props) {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-tight">Projects &amp; Research</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-secondary">
        A running tab of what I&apos;m building, across applied software and
        research prototypes. Metadata is hand-authored; live GitHub activity
        is refreshed weekly by a scheduled job.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Projects" value={totalProjects} />
        <Stat label="Active" value={live} accent="green" />
        <Stat label="Shipped" value={shipped} accent="blue" />
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
