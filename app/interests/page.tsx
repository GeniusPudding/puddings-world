export const metadata = {
  title: "Interests · puddingsworld",
  description: "What I'm into outside the main thread.",
};

const SECTIONS = [
  {
    title: "Games",
    body:
      "TODO: Go, board games, video games, designing your own games — fill in what fits. The InvisibleGo project came out of this.",
  },
  {
    title: "Music",
    body:
      "TODO: instruments you play, genres you obsess over, production tools. Reprise Studio came out of this.",
  },
  {
    title: "Reading",
    body:
      "TODO: a few books / authors / fields that have shaped how you think. No need for a full shelf — three to five is enough.",
  },
  {
    title: "Movement",
    body:
      "TODO: running, climbing, lifting, hiking, whatever — or skip this section if it's not a thread for you.",
  },
  {
    title: "Other rabbit holes",
    body:
      "TODO: weird ones. Cooking, languages, fountain pens, urban planning, electronic music history. The stuff that doesn't fit anywhere else but explains a lot about you.",
  },
];

export default function InterestsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          interests
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Outside the main thread.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
          About is the structured intro. This page is the unstructured one —
          the things I do with the rest of the time, some of which leak back
          into the projects.
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="rounded-xl border border-bg-border bg-bg-panel p-6"
          >
            <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-12 text-xs text-ink-muted">
        Edit{" "}
        <code className="rounded bg-bg-raised px-1 font-mono">
          app/interests/page.tsx
        </code>
        . Drop sections you don&apos;t care about; add ones you do. The point
        is to feel like a person, not a CV.
      </p>
    </main>
  );
}
