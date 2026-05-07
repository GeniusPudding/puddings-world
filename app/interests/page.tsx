import { interests, type InterestSection } from "@/content/interests";

export const metadata = {
  title: "Interests · puddingsworld",
  description: "Things I consume — reading, listening, playing, watching, eating.",
};

export default function InterestsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          interests
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Things I keep returning to.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
          What I consume — books, music, games, films, food. The inputs side.{" "}
          <span className="text-ink-muted">
            (What I create lives in <a href="/musings" className="hover:text-accent">/musings</a>,{" "}
            <a href="/projects" className="hover:text-accent">/projects</a>, and{" "}
            <a href="/playground" className="hover:text-accent">/playground</a>.)
          </span>
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {interests.map((section) => (
          <Section key={section.slug} section={section} />
        ))}
      </div>

      <p className="mt-12 text-xs italic text-ink-muted">
        Edit{" "}
        <code className="rounded bg-bg-raised px-1 font-mono not-italic">
          content/interests.ts
        </code>
        {" "}to add or change items. Each section: 3–5 items + an optional
        &ldquo;why these&rdquo; one-liner.
      </p>
    </main>
  );
}

function Section({ section }: { section: InterestSection }) {
  return (
    <section className="rounded-xl border border-bg-border bg-bg-panel p-6 sm:p-7">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-primary">
          {section.label}
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          {section.items.length} item{section.items.length === 1 ? "" : "s"}
        </span>
      </header>
      <p className="mt-2 text-sm text-ink-secondary">{section.eyebrow}</p>

      {section.items.length > 0 ? (
        <>
          <ul className="mt-5 divide-y divide-bg-border/60 font-mono text-sm">
            {section.items.map((item, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 py-2.5"
              >
                {item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 truncate text-ink-primary transition-colors hover:text-accent"
                  >
                    {item.primary}
                  </a>
                ) : (
                  <span className="min-w-0 truncate text-ink-primary">
                    {item.primary}
                  </span>
                )}
                {item.secondary && (
                  <span className="shrink-0 text-right text-xs text-ink-muted">
                    {item.secondary}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {section.whyThese && (
            <p className="mt-5 border-t border-bg-border pt-4 text-sm italic leading-relaxed text-ink-secondary">
              <span className="not-italic font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Why these —{" "}
              </span>
              {section.whyThese}
            </p>
          )}
        </>
      ) : (
        <p className="mt-5 font-mono text-xs italic text-ink-muted">
          (empty — open{" "}
          <code className="not-italic">content/interests.ts</code>, find the{" "}
          <code className="not-italic">{section.slug}</code> section, push items
          into <code className="not-italic">items: [...]</code>)
        </p>
      )}
    </section>
  );
}
