export const metadata = {
  title: "About · puddingsworld",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          about
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Hi, I&apos;m the person behind puddingsworld.
        </h1>
      </header>

      <section className="mt-10 space-y-5 text-base leading-relaxed text-ink-secondary">
        <p>
          {/* TODO: replace with your real bio. Suggested 3-5 short paragraphs covering: */}
          {/*   1. who you are (one line, the headline) */}
          {/*   2. what you work on / what problems pull at you */}
          {/*   3. background — education, prior work, defining experiences */}
          {/*   4. how you like to collaborate / what you say yes to */}
          {/*   5. anything personal worth knowing (optional) */}
          Bio TBD. This is a placeholder paragraph so the page renders during
          development. Open <code className="rounded bg-bg-raised px-1 font-mono text-sm">app/about/page.tsx</code>{" "}
          and replace this section with your real bio.
        </p>
      </section>

      <section className="mt-12 border-t border-bg-border pt-8">
        <h2 className="text-lg font-semibold tracking-tight">Selected background</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-secondary">
          <li className="font-mono text-ink-muted">TODO — list education, roles, notable projects</li>
        </ul>
      </section>
    </main>
  );
}
