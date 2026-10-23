"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
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
import { Disc } from "./LyricDisc";
import { openMusing } from "./MusingTransition";

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
  const router = useRouter();
  const swiperRef = useRef<SwiperType | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Browsers only allow sound after a click, so playback starts from a
  // card's button; from then on the music follows the carousel.
  const listening = useRef(false);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  // Opening the focused piece only glides if its page is already loaded.
  function prefetchFocused(index: number) {
    const m = musings[index];
    if (linkable && m) router.prefetch(`/musings/${m.slug}`);
  }

  function playFor(m: Musing | undefined) {
    const audio = audioRef.current;
    if (!audio) return;
    if (!m?.audio) {
      audio.pause();
      return;
    }
    if (audio.src !== m.audio) audio.src = m.audio;
    swiperRef.current?.autoplay?.stop();
    audio.play().then(
      () => setPlaying(m.slug),
      () => setPlaying(null),
    );
  }

  function toggle(m: Musing) {
    if (playing === m.slug) {
      listening.current = false;
      audioRef.current?.pause();
      return;
    }
    listening.current = true;
    playFor(m);
  }

  return (
    <div className="musings-carousel">
      <audio
        ref={audioRef}
        preload="none"
        onPause={() => setPlaying(null)}
        onEnded={() => swiperRef.current?.slideNext()}
      />
      <Swiper
        onSwiper={(s) => {
          swiperRef.current = s;
          prefetchFocused(s.realIndex);
        }}
        onSlideChange={(s) => {
          prefetchFocused(s.realIndex);
          if (listening.current) playFor(musings[s.realIndex]);
        }}
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
            style={{ width: m.type === "lyrics" ? "min(440px, 84vw)" : "min(560px, 88vw)" }}
            className="!h-auto"
          >
            {m.type === "lyrics" ? (
              <LyricCover
                musing={m}
                linkable={linkable}
                playing={playing === m.slug}
                onToggle={() => toggle(m)}
              />
            ) : (
              <MusingCard
                musing={m}
                linkable={linkable}
                playing={playing === m.slug}
                onToggle={() => toggle(m)}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function ListenButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={playing}
      className={`relative z-10 flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
        playing
          ? "border-accent-amber/60 text-accent-amber"
          : "border-bg-border bg-bg-panel/60 text-ink-secondary hover:border-accent-amber/60 hover:text-accent-amber"
      }`}
    >
      <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
      {playing ? "pause" : "listen"}
    </button>
  );
}

/**
 * A song as a record sleeve: its title written down the side, a couple of
 * lines from it, and a disc that turns while it plays. The words wait inside.
 */
function LyricCover({
  musing,
  linkable,
  playing,
  onToggle,
}: {
  musing: Musing;
  linkable: boolean;
  playing: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLElement | null>(null);
  const href = `/musings/${musing.slug}`;
  const hook = musing.hook ?? musing.body.split("\n").slice(0, 2).join("\n");

  return (
    <article
      ref={ref}
      className="lyric-cover group relative isolate flex aspect-[4/5] flex-col overflow-hidden rounded-2xl border border-bg-border bg-bg-panel p-7 sm:aspect-square sm:p-9"    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(110% 80% at 100% 100%, color-mix(in srgb, var(--color-accent-amber) 13%, transparent), transparent 60%), radial-gradient(80% 60% at 0% 0%, color-mix(in srgb, var(--color-accent) 7%, transparent), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="lyric-vertical pointer-events-none absolute right-5 top-6 -z-10 select-none font-serif text-6xl leading-none tracking-[0.2em] text-ink-primary/[0.06] sm:text-7xl"
      >
        {musing.title}
      </span>
      <Disc
        spinning={playing}
        className="absolute -bottom-16 -right-16 -z-10 h-56 w-56 opacity-70 transition-transform duration-700 group-hover:-translate-x-2 group-hover:-translate-y-2"
      />

      <div className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted">
        <span className="text-accent-amber">lyrics</span>
        {musing.date && <span>{musing.date}</span>}
      </div>

      <div className="my-auto max-w-[80%] py-6">
        <span aria-hidden className="block h-px w-8 bg-accent-amber/60" />
        <p className="mt-5 whitespace-pre-line font-serif text-lg font-normal leading-[2] tracking-wide text-ink-secondary sm:text-xl">
          {hook}
        </p>
      </div>

      <div>
        <h3
          data-vt="title"
          className="w-fit font-serif text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl"
        >
          {musing.title}
        </h3>
        <div className="mt-4 flex min-h-7 items-center justify-between gap-3">
          {musing.audio ? (
            <ListenButton playing={playing} onToggle={onToggle} />
          ) : (
            <span className="font-mono text-xs italic text-ink-muted">♪ recording coming soon</span>
          )}
          {linkable && (
            <span className="font-mono text-xs text-ink-muted transition-colors group-hover:text-accent">
              read →
            </span>
          )}
        </div>
      </div>

      {linkable && (
        <a
          href={href}
          aria-label={`Read ${musing.title ?? "the lyrics"}`}
          className="lyric-cover-link absolute inset-0 z-0"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            openMusing(router, href, ref.current);
          }}
        />
      )}
    </article>
  );
}

function MusingCard({
  musing,
  linkable,
  playing,
  onToggle,
}: {
  musing: Musing;
  linkable: boolean;
  playing: boolean;
  onToggle: () => void;
}) {
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

      {(linkable || musing.type === "lyrics") && (
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-bg-border pt-4">
          {musing.audio ? (
            <ListenButton playing={playing} onToggle={onToggle} />
          ) : musing.type === "lyrics" ? (
            <span className="font-mono text-xs italic text-ink-muted">♪ recording coming soon</span>
          ) : (
            <span />
          )}
          {linkable && (
            <Link
              href={`/musings/${musing.slug}`}
              className="font-mono text-xs text-ink-muted transition-colors hover:text-accent"
              onClick={(e) => e.stopPropagation()}
            >
              {truncated ? "read full" : "open"} →
            </Link>
          )}
        </div>
      )}
    </article>
  );
}
