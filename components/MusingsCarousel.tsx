"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  EffectCoverflow,
  Keyboard,
  Pagination,
  Navigation,
  A11y,
  Mousewheel,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
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

const TYPE_TINT: Record<MusingType, string> = {
  poem: "var(--color-accent)",
  lyrics: "var(--color-accent-amber)",
  dessert: "var(--color-accent-red)",
  note: "var(--color-accent-green)",
};

const TYPE_MARK: Record<MusingType, string> = {
  poem: "❦",
  lyrics: "♪",
  dessert: "✧",
  note: "¶",
};

export const AUTOPLAY_MS = 7000;

export function MusingsCarousel({
  musings,
  linkable = true,
}: {
  musings: Musing[];
  /** Off on previews, where the pieces have no page yet. */
  linkable?: boolean;
}) {
  return (
    <div className="musings-carousel">
      <Swiper
        modules={[
          Autoplay,
          EffectCoverflow,
          Keyboard,
          Pagination,
          Navigation,
          A11y,
          Mousewheel,
        ]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        loop={musings.length > 2}
        keyboard={{ enabled: true }}
        mousewheel={{ forceToAxis: true, sensitivity: 0.5 }}
        pagination={{ clickable: true }}
        navigation
        slideToClickedSlide
        autoplay={
          musings.length > 1
            ? { delay: AUTOPLAY_MS, pauseOnMouseEnter: true, disableOnInteraction: true }
            : false
        }
        speed={550}
        coverflowEffect={{
          rotate: 32,
          stretch: 0,
          depth: 220,
          modifier: 1,
          slideShadows: false,
        }}
        className="!pb-14"
      >
        {musings.map((m) => (
          <SwiperSlide
            key={m.slug}
            style={{ width: "min(560px, 88vw)" }}
            className="!h-auto"
          >
            <MusingCard musing={m} linkable={linkable} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function MusingCard({ musing, linkable }: { musing: Musing; linkable: boolean }) {
  const text = musing.excerpt ?? musing.body;
  const truncated =
    !!musing.excerpt && musing.excerpt.length < musing.body.length;

  return (
    <article className="relative isolate overflow-hidden rounded-2xl border border-bg-border bg-bg-panel px-7 py-10 sm:px-12 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(120% 70% at 100% 0%, color-mix(in srgb, ${TYPE_TINT[musing.type]} 11%, transparent), transparent 62%), radial-gradient(90% 60% at 0% 100%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 70%)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 right-4 -z-10 select-none font-serif text-[9rem] leading-none text-ink-primary/[0.035]"
      >
        {TYPE_MARK[musing.type]}
      </span>
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
        <p className="mt-6 font-mono text-xs text-ink-muted">{musing.meta}</p>
      )}

      {linkable && (
      <div className="mt-8 flex items-baseline justify-end border-t border-bg-border pt-4">
        <Link
          href={`/musings/${musing.slug}`}
          className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
          onClick={(e) => e.stopPropagation()}
        >
          {truncated ? "read full" : "open"} →
        </Link>
      </div>
      )}
    </article>
  );
}
