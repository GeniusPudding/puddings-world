import { MusingsCarousel } from "@/components/MusingsCarousel";
import { musings, sayings } from "@/content/musings";

export const metadata = {
  title: "Musings · puddingsworld",
  description:
    "Song lyrics, sayings and short pieces I've written. The unhurried side of puddingsworld.",
};

function sortByDateDesc(a: { date?: string }, b: { date?: string }) {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

export default function MusingsPage() {
  const sorted = [...musings].sort(sortByDateDesc);
  const sortedSayings = [...sayings].sort(sortByDateDesc);

  return (
    <main className="w-full py-16">
      <div className="mx-auto w-full max-w-3xl px-6">
        <header className="mb-14 text-center sm:text-left">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            musings
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Short pieces, slowly.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-secondary">
            Lyrics I&apos;ve written, the odd poem, and sayings I&apos;ve
            collected from my own notebooks. Drag, swipe, arrow keys, or click
            a side card to focus.
          </p>
        </header>
      </div>

      <div className="mx-auto w-full max-w-6xl px-2 sm:px-6">
        <MusingsCarousel musings={sorted} />
      </div>

      <div className="mx-auto w-full max-w-3xl px-6">
        <p className="mt-12 text-center font-mono text-xs text-ink-muted">
          {sorted.length} piece{sorted.length === 1 ? "" : "s"} · newest first
        </p>
      </div>

      {sortedSayings.length > 0 && (
        <section className="mx-auto mt-20 w-full max-w-5xl px-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            sayings
          </h2>
          <ul className="mt-6 gap-4 sm:columns-2 lg:columns-3">
            {sortedSayings.map((s, i) => (
              <li
                key={i}
                className="mb-4 break-inside-avoid rounded-xl border border-bg-border bg-bg-panel p-5"
              >
                <p className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink-primary">
                  {s.text}
                </p>
                {(s.date || s.context) && (
                  <p className="mt-3 font-mono text-[11px] text-ink-muted">
                    {[s.context, s.date].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
