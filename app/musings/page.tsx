import { MusingsCarousel } from "@/components/MusingsCarousel";
import { SayingsCarousel } from "@/components/SayingsCarousel";
import { loadMusings } from "@/lib/musings";

// Same window as DOC_REVALIDATE_SEC; Next needs a literal here.
export const revalidate = 600;

export const metadata = {
  title: "Musings",
  description:
    "Song lyrics, sayings and short pieces I've written. The unhurried side of puddingsworld.",
};

export default async function MusingsPage() {
  const { musings, sayings } = await loadMusings();

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

      {musings.length > 0 && (
        <>
          <div className="mx-auto w-full max-w-6xl px-2 sm:px-6">
            <MusingsCarousel musings={musings} />
          </div>
          <div className="mx-auto w-full max-w-3xl px-6">
            <p className="mt-12 text-center font-mono text-xs text-ink-muted">
              {musings.length} piece{musings.length === 1 ? "" : "s"} · newest first
            </p>
          </div>
        </>
      )}

      {sayings.length > 0 && (
        <section className="mt-20 w-full">
          <h2 className="mx-auto w-full max-w-5xl px-6 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            sayings
          </h2>
          <div className="mt-6">
            <SayingsCarousel sayings={sayings} />
          </div>
        </section>
      )}
    </main>
  );
}
