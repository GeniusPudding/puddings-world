import Link from "next/link";

export const metadata = {
  title: "Playground · puddingsworld",
  description: "Fun links, mini games, and small experiments.",
};

type Tag = "game" | "demo" | "link" | "experiment";

const TAG_STYLE: Record<Tag, string> = {
  game: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  demo: "border-accent/40 bg-accent/10 text-accent",
  link: "border-accent-green/40 bg-accent-green/10 text-accent-green",
  experiment: "border-accent-red/40 bg-accent-red/10 text-accent-red",
};

type Item = {
  tag: Tag;
  title: string;
  blurb: string;
  href: string;
  external?: boolean;
};

// TODO: replace these placeholders with real things you've built or things
// you find genuinely worth pointing people at. Keep the bar low — this page
// is the "no pressure, just hang out" room of the site.
const ITEMS: Item[] = [
  {
    tag: "game",
    title: "InvisibleGo (web playable build)",
    blurb:
      "Once a playable web build of InvisibleGo lands, link it here. Until then, point at the repo.",
    href: "/projects/invisible-go",
  },
  {
    tag: "demo",
    title: "TODO — interactive EPG visualizer",
    blurb:
      "Embed a small visualizer that lets visitors scrub through a sample EPG signal and see the model's segmentation in real time.",
    href: "#",
  },
  {
    tag: "link",
    title: "TODO — a curious paper / blog post worth sharing",
    blurb:
      "Drop links to things that pulled you off the road for an afternoon. One sentence on why each was good.",
    href: "#",
    external: true,
  },
  {
    tag: "experiment",
    title: "TODO — a half-finished side experiment",
    blurb:
      "Things that didn't graduate to /projects but were too fun to delete. Show your work, including the dead ends.",
    href: "#",
  },
];

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          playground
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Fun stuff. No pressure.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
          Mini games, interactive demos, curious links, half-finished
          experiments. The room where I keep the things that don&apos;t need
          a status badge or a release tag — they just have to be fun.
        </p>
      </header>

      <ul className="mt-12 space-y-4">
        {ITEMS.map((item, i) => {
          const Wrapper = item.external ? "a" : Link;
          const wrapperProps = item.external
            ? { href: item.href, target: "_blank", rel: "noreferrer" }
            : { href: item.href };
          return (
            <li key={i}>
              <Wrapper
                {...(wrapperProps as { href: string })}
                className="group flex items-start gap-4 rounded-xl border border-bg-border bg-bg-panel p-5 transition-colors hover:border-ink-muted"
              >
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TAG_STYLE[item.tag]}`}
                >
                  {item.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {item.title}
                    {item.external && (
                      <span className="ml-1 text-ink-muted">↗</span>
                    )}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
                    {item.blurb}
                  </p>
                </div>
              </Wrapper>
            </li>
          );
        })}
      </ul>

      <p className="mt-12 text-xs italic text-ink-muted">
        Edit{" "}
        <code className="rounded bg-bg-raised px-1 font-mono not-italic">
          app/playground/page.tsx
        </code>
        {" "}to add or remove items. Tags available:{" "}
        <code className="rounded bg-bg-raised px-1 font-mono not-italic">
          game / demo / link / experiment
        </code>
        .
      </p>
    </main>
  );
}
