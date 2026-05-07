import Link from "next/link";

export const metadata = {
  title: "About · puddingsworld",
};

const BACKGROUND = [
  {
    period: "Now",
    detail:
      "Large-model research and infrastructure engineering at an AI / LLM-chip company.",
  },
  {
    period: "MS",
    detail:
      "Computer Science, National Taiwan University — Intelligent Medicine Program.",
  },
  {
    period: "BS",
    detail: "Mathematics, National Taiwan University. Minor in Computer Science.",
  },
];

const PULLS = [
  "Models that have to survive contact with real-world data — clinical signals, surgical video, messy time series — not just clean synthetic benchmarks.",
  "The infrastructure that turns a research idea into something other people can run at scale tomorrow morning, not just on the original author's laptop.",
  "Staying deliberately generalist — games, audio, AR, simulation — as a way to keep code muscles I'd otherwise lose by specializing too hard.",
];

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          about
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
          Hi, I&apos;m GeniusPudding.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-secondary">
          My day-to-day is{" "}
          <span className="text-ink-primary">AI / LLM-chip work</span>
          {" "}— large-model research and infrastructure engineering. Around
          that, I tinker. The projects on this site are what falls out of
          trying to ship real things across biosignals, surgical perception,
          audio, simulation, and games — usually one repo at a time, often
          before deciding which of those threads I&apos;m &ldquo;supposed&rdquo;
          to pick.
        </p>
      </header>

      <section className="mt-12 rounded-xl border border-bg-border bg-bg-panel p-6 sm:p-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          Background
        </h2>
        <ul className="mt-5 space-y-4">
          {BACKGROUND.map((b) => (
            <li
              key={b.period}
              className="grid grid-cols-[80px_1fr] gap-4 sm:grid-cols-[100px_1fr]"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-accent">
                {b.period}
              </span>
              <span className="text-sm leading-relaxed text-ink-secondary">
                {b.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-bg-border bg-bg-panel p-6 sm:p-8">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          What keeps pulling me back
        </h2>
        <ul className="mt-5 space-y-3">
          {PULLS.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span className="text-sm leading-relaxed text-ink-secondary">
                {p}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs italic text-ink-muted">
          TODO: tighten this section in your own voice once you&apos;ve stewed
          on it — the page reads better when it&apos;s phrased exactly the way
          you&apos;d say it out loud.
        </p>
      </section>

      <section className="mt-12 rounded-xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
        <h2 className="text-base font-semibold tracking-tight">
          Where to go next
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li>
            <Link href="/projects" className="text-accent hover:underline">
              → /projects
            </Link>{" "}
            <span className="text-ink-muted">
              — the live catalog, refreshed weekly
            </span>
          </li>
          <li>
            <Link href="/interests" className="text-accent hover:underline">
              → /interests
            </Link>{" "}
            <span className="text-ink-muted">
              — the unstructured rest of who I am
            </span>
          </li>
          <li>
            <Link href="/services" className="text-accent hover:underline">
              → /services
            </Link>{" "}
            <span className="text-ink-muted">
              — what I take on outside the day-to-day
            </span>
          </li>
          <li>
            <Link href="/contact" className="text-accent hover:underline">
              → /contact
            </Link>{" "}
            <span className="text-ink-muted">
              — fastest way to reach me
            </span>
          </li>
        </ul>
      </section>
    </main>
  );
}
