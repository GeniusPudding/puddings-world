import { MusingsCarousel } from "@/components/MusingsCarousel";
import { musings } from "@/content/musings";

export const metadata = {
  title: "Musings · puddingsworld",
  description:
    "Short poems, song lyrics, and stories from a small kitchen lab. The unhurried side of puddingsworld.",
};

function sortByDateDesc(a: { date?: string }, b: { date?: string }) {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

export default function MusingsPage() {
  const sorted = [...musings].sort(sortByDateDesc);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <header className="mb-14 text-center sm:text-left">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
          musings
        </p>
        <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          Short pieces, slowly.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-secondary">
          Poems, lyrics, and small stories from the dessert lab. The room
          where I try to write the way other people doodle. Swipe through —
          they&apos;re meant to be read one at a time.
        </p>
      </header>

      <MusingsCarousel musings={sorted} />

      <p className="mt-16 text-center font-mono text-xs text-ink-muted">
        {sorted.length} piece{sorted.length === 1 ? "" : "s"} · newest first
      </p>
    </main>
  );
}
