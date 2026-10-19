import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { MusingType } from "@/content/musings";
import { loadMusings } from "@/lib/musings";

const TYPE_COLOR: Record<MusingType, string> = {
  poem: "text-accent",
  lyrics: "text-accent-amber",
  dessert: "text-accent-red",
  note: "text-accent-green",
};

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await loadMusings()).musings.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = (await loadMusings()).musings.find((x) => x.slug === slug);
  if (!m) return { title: "Not found" };
  return {
    title: `${m.title ?? m.type} · musings · puddingsworld`,
    description: m.body.split("\n").slice(0, 2).join(" "),
  };
}

export default async function MusingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ordered = (await loadMusings()).musings;
  const idx = ordered.findIndex((x) => x.slug === slug);
  if (idx === -1) notFound();
  const m = ordered[idx];
  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <Link
        href="/musings"
        className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
      >
        ← musings
      </Link>

      <article className="mt-8">
        <header className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">
            {m.date ?? ""}
          </span>
          <span className={`font-mono text-xs italic ${TYPE_COLOR[m.type]}`}>
            {m.type}
          </span>
        </header>

        {m.title && (
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            {m.title}
          </h1>
        )}

        {m.audio ? (
          <audio controls preload="none" src={m.audio} className="mt-6 w-full" />
        ) : (
          m.type === "lyrics" && (
            <p className="mt-4 font-mono text-xs italic text-ink-muted">♪ recording coming soon</p>
          )
        )}

        {m.image && (
          <figure className="mt-8 overflow-hidden rounded-xl border border-bg-border">
            <div className="relative aspect-[4/3]">
              <Image
                src={m.image}
                alt={m.imageCaption ?? m.title ?? "musing"}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 640px, 100vw"
              />
            </div>
            {m.imageCaption && (
              <figcaption className="bg-bg-panel px-4 py-2 text-center font-mono text-xs text-ink-muted">
                {m.imageCaption}
              </figcaption>
            )}
          </figure>
        )}

        <div
          className={`whitespace-pre-line font-serif text-lg leading-[1.9] text-ink-primary ${m.title || m.image ? "mt-8" : "mt-10"}`}
        >
          {m.body}
        </div>

        {m.meta && (
          <p className="mt-8 font-mono text-xs text-ink-muted">{m.meta}</p>
        )}
      </article>

      <nav className="mt-16 flex items-center justify-between border-t border-bg-border pt-6 text-sm">
        {prev ? (
          <Link
            href={`/musings/${prev.slug}`}
            className="text-ink-muted transition-colors hover:text-accent"
          >
            ← {prev.title ?? prev.type}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/musings/${next.slug}`}
            className="text-right text-ink-muted transition-colors hover:text-accent"
          >
            {next.title ?? next.type} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
