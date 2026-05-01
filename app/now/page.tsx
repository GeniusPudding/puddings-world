export const metadata = {
  title: "Now · puddingsworld",
  description: "What I'm currently working on.",
};

const LAST_UPDATED = "2026-05-01";

export default function NowPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          now
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          What I&apos;m focused on right now.
        </h1>
        <p className="mt-3 font-mono text-xs text-ink-muted">
          Last updated {LAST_UPDATED}
        </p>
      </header>

      <section className="mt-10 space-y-5 text-base leading-relaxed text-ink-secondary">
        <p>
          {/* TODO: every month or so, replace these bullets with your current focus. */}
          {/* See https://nownownow.com for the original concept. Keep it honest — */}
          {/* the value of a /now page is being a quick snapshot, not aspirational. */}
          Placeholder. Open{" "}
          <code className="rounded bg-bg-raised px-1 font-mono text-sm">
            app/now/page.tsx
          </code>{" "}
          and write 3–6 short bullets on what you&apos;re actually doing this month
          — research threads, side projects, things you&apos;re reading or
          learning.
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-accent">·</span>
            <span className="text-ink-muted">TODO — current research thread</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">·</span>
            <span className="text-ink-muted">TODO — current side project</span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">·</span>
            <span className="text-ink-muted">TODO — what you&apos;re reading / learning</span>
          </li>
        </ul>
      </section>
    </main>
  );
}
