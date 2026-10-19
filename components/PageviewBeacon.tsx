"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Reports each page view to /api/track; the referrer only on landing. */
export function PageviewBeacon() {
  const pathname = usePathname();
  const landed = useRef(false);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const first = !landed.current;
    landed.current = true;
    const body = JSON.stringify({
      path: pathname,
      ...(first
        ? {
            referrer: document.referrer,
            utm: new URLSearchParams(window.location.search).get("utm_source"),
          }
        : {}),
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
