"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import {
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

export function MusingsCarousel({ musings }: { musings: Musing[] }) {
  return (
    <div className="musings-carousel">
      <Swiper
        modules={[
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
            <MusingCard musing={m} />
          </SwiperSlide>
        ))}
      </Swiper>
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
        <p className="mt-6 font-mono text-xs text-ink-muted">{musing.meta}</p>
      )}

      <div className="mt-8 flex items-baseline justify-end border-t border-bg-border pt-4">
        <Link
          href={`/musings/${musing.slug}`}
          className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
          onClick={(e) => e.stopPropagation()}
        >
          {truncated ? "read full" : "open"} →
        </Link>
      </div>
    </article>
  );
}
