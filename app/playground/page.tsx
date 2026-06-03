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

const ITEMS: Item[] = [
  {
    tag: "game",
    title: "Reverse Turing Test",
    blurb:
      "A live-talk party game for 20-30 phones. In 2050, silicon-based life rules the net — the last humans must pretend to be AI to survive. An AI judge scores everyone, the most AI-like get cut, and eliminated players become the jury for the final.",
    href: "https://reverse-turing.puddings-world.com",
    external: true,
  },
  {
    tag: "game",
    title: "InvisibleGo",
    blurb:
      "A partially-observable Go variant — you only see part of the board. Play against a trained RL agent.",
    href: "/projects/invisible-go",
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

    </main>
  );
}
