"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Autoplay, FreeMode, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import type { Saying } from "@/content/musings";

/** A slowly drifting strip of sayings; pauses while hovered or touched. */
export function SayingsCarousel({ sayings }: { sayings: Saying[] }) {
  return (
    <div className="sayings-carousel">
      <Swiper
        modules={[A11y, Autoplay, FreeMode, Keyboard]}
        slidesPerView="auto"
        spaceBetween={16}
        slidesOffsetBefore={16}
        slidesOffsetAfter={16}
        loop={sayings.length > 3}
        freeMode={{ enabled: true, momentum: true }}
        keyboard={{ enabled: true }}
        grabCursor
        speed={6000}
        autoplay={
          sayings.length > 1
            ? { delay: 0, pauseOnMouseEnter: true, disableOnInteraction: false }
            : false
        }
      >
        {sayings.map((s, i) => (
          <SwiperSlide key={i} style={{ width: "min(340px, 80vw)" }} className="!h-auto">
            <figure className="relative isolate flex h-full flex-col justify-between overflow-hidden rounded-xl border border-bg-border bg-bg-panel p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    "radial-gradient(100% 70% at 0% 0%, color-mix(in srgb, var(--color-accent) 9%, transparent), transparent 65%)",
                }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 left-3 -z-10 select-none font-serif text-[7rem] leading-none text-ink-primary/[0.05]"
              >
                “
              </span>
              <blockquote className="whitespace-pre-line font-serif text-lg leading-relaxed text-ink-primary">
                {s.text}
              </blockquote>
              {(s.date || s.context) && (
                <figcaption className="mt-4 font-mono text-[11px] text-ink-muted">
                  {[s.context, s.date].filter(Boolean).join(" · ")}
                </figcaption>
              )}
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
