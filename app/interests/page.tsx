import Link from "next/link";
import { interests, type InterestSection } from "@/content/interests";

export const metadata = {
  title: "Interests",
  description: "What I read, sing, eat and play: papers, Mandopop, Taipei food, Go, basketball, science, literature, history.",
};

export default function InterestsPage() {
  const filled = interests.filter((s) => s.items.length > 0);
  const compact = interests.filter((s) => s.items.length === 0);
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
          Papers I&apos;m reading, songs I sing, places I eat, and the
          things I think about when I&apos;m not building.{" "}
          <span className="text-ink-muted">
            (What I create lives in <a href="/musings" className="hover:text-accent">/musings</a>,{" "}
            <a href="/projects" className="hover:text-accent">/projects</a>, and{" "}
            <a href="/playground" className="hover:text-accent">/playground</a>.)
          </span>
        </p>
      </header>

      {filled.length > 0 && (
        <div className="mt-12 space-y-8">
          {filled.map((section) => (
            <Section key={section.slug} section={section} />
          ))}
        </div>
      )}

      {compact.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
            Also into
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {compact.map((section) => (
              <li
                key={section.slug}
                className="min-w-0 rounded-xl border border-bg-border bg-bg-panel p-5"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-primary">
                  {section.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                  {section.eyebrow}
                </p>
                {section.href && (
                  <Link
                    href={section.href}
                    className="mt-3 inline-block font-mono text-xs text-ink-muted hover:text-accent"
                  >
                    see more →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      </header>
      <p className="mt-2 text-sm text-ink-secondary">{section.eyebrow}</p>

      <ul className="mt-5 divide-y divide-bg-border/60 font-mono text-sm">
        {section.items.map((item, i) => (
          <li
            key={i}
            className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            {item.href ? (
              <a
                href={item.href}
                {...(item.href.startsWith("/")
                  ? {}
                  : { target: "_blank", rel: "noreferrer" })}
                className="min-w-0 text-ink-primary transition-colors hover:text-accent"
              >
                {item.primary}
              </a>
            ) : (
              <span className="min-w-0 text-ink-primary">
                {item.primary}
              </span>
            )}
            {item.secondary && (
              <span className="shrink-0 text-xs text-ink-muted sm:text-right">
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
    </section>
  );
}
