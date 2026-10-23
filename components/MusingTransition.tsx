"use client";

import { useEffect } from "react";

type AppRouter = { push: (href: string) => void };
type WithTransitions = Document & {
  startViewTransition?: (update: () => Promise<void>) => unknown;
};

// The page stays frozen while a view transition waits, so give up early and
// let a slow page arrive without the glide.
const MAX_WAIT_MS = 800;

let landed: (() => void) | null = null;

/**
 * Opens a piece so its card's title and disc glide into the page's heading.
 * The swap finishes once the new page mounts <MusingLanding />; browsers
 * without view transitions, and visitors who prefer less motion, just navigate.
 */
export function openMusing(router: AppRouter, href: string, card: HTMLElement | null) {
  const doc = document as WithTransitions;
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    router.push(href);
    return;
  }
  card?.querySelector<HTMLElement>("[data-vt=title]")?.style.setProperty("view-transition-name", "musing-title");
  card?.querySelector<HTMLElement>("[data-vt=disc]")?.style.setProperty("view-transition-name", "musing-disc");
  doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        landed = resolve;
        setTimeout(resolve, MAX_WAIT_MS);
        router.push(href);
      }),
  );
}

export function MusingLanding() {
  useEffect(() => {
    landed?.();
    landed = null;
  }, []);
  return null;
}
