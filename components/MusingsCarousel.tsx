"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import type { Musing, MusingType } from "@/content/musings";

const TYPE_LABEL: Record<MusingType, string> = {
  poem: "poem",
  lyrics: "lyrics",
  dessert: "dessert",
  note: "note",
};

const TYPE_COLOR: Record<MusingType, string> = {
  poem: "text-accent",
  lyrics: "text-accent-amber",
  dessert: "text-accent-red",
  note: "text-accent-green",
};

export function MusingsCarousel({ musings }: { musings: Musing[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  return (
    <div className="space-y-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {musings.map((m) => (
            <div
              key={m.slug}
              className="min-w-0 shrink-0 grow-0 basis-full px-2 sm:px-4"
            >
              <MusingCard musing={m} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-6">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label="Previous"
          disabled={selectedIndex === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-bg-border text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-bg-border disabled:hover:text-ink-muted"
        >
          ‹
        </button>

        <div className="flex items-center gap-2">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === selectedIndex
                  ? "w-8 bg-accent"
                  : "w-1.5 bg-bg-border hover:bg-ink-muted"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          aria-label="Next"
          disabled={selectedIndex === scrollSnaps.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-bg-border text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-bg-border disabled:hover:text-ink-muted"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function MusingCard({ musing }: { musing: Musing }) {
  const text = musing.excerpt ?? musing.body;
  const truncated =
    !!musing.excerpt && musing.excerpt.length < musing.body.length;

  return (
    <article className="rounded-2xl border border-bg-border bg-bg-panel px-7 py-10 sm:px-12 sm:py-14">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">
          {musing.date ?? ""}
        </span>
        <span
          className={`font-mono text-xs italic ${TYPE_COLOR[musing.type]}`}
        >
          {TYPE_LABEL[musing.type]}
        </span>
      </div>

      {musing.title && (
        <h3 className="mt-6 font-serif text-2xl font-medium tracking-tight text-ink-primary">
          {musing.title}
        </h3>
      )}

      <div
        className={`whitespace-pre-line font-serif text-lg leading-[1.85] text-ink-primary ${musing.title ? "mt-4" : "mt-8"}`}
      >
        {text}
      </div>

      {musing.meta && (
        <p className="mt-6 font-mono text-xs text-ink-muted">
          {musing.meta}
        </p>
      )}

      <div className="mt-8 flex items-baseline justify-end border-t border-bg-border pt-4">
        <Link
          href={`/musings/${musing.slug}`}
          className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
        >
          {truncated ? "read full" : "open"} →
        </Link>
      </div>
    </article>
  );
}
