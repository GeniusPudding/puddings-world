"use client";

import { useState } from "react";
import Link from "next/link";

type Identity = {
  key: string;
  label: string;
  emoji: string;
  greeting: string;
  routes: { label: string; href: string; external?: boolean }[];
};

const IDENTITIES: Identity[] = [
  {
    key: "hacker",
    label: "hacker",
    emoji: "🔧",
    greeting:
      "Welcome, fellow tinkerer. Most things here have source attached. Project dashboard has live commit / release activity. Pull requests welcome.",
    routes: [
      { label: "Project dashboard with live activity", href: "/projects" },
      {
        label: "GitHub @GeniusPudding",
        href: "https://github.com/GeniusPudding",
        external: true,
      },
      { label: "Suggested first stop: InvisibleGo", href: "/projects" },
    ],
  },
  {
    key: "client",
    label: "client",
    emoji: "🤝",
    greeting:
      "Hi. I take on a small number of consulting / build engagements alongside research. Read services for what I take on, then email with rough scope, timeline, and budget.",
    routes: [
      { label: "What I offer", href: "/services" },
      { label: "Get in touch", href: "/contact" },
    ],
  },
  {
    key: "researcher",
    label: "researcher",
    emoji: "📚",
    greeting:
      "Welcome. Research-flavored work lives in projects (look for tags like biosignal, physics-ml, simulation). Papers and talks are in flux — email is fastest if you want to dig in or collaborate.",
    routes: [
      { label: "Projects with research output", href: "/projects" },
      { label: "Email me", href: "/contact" },
    ],
  },
  {
    key: "curious",
    label: "curious",
    emoji: "👋",
    greeting:
      "No pressure. /about explains the bigger picture. /playground has the fun stuff. /projects has everything I've made room for.",
    routes: [
      { label: "About me", href: "/about" },
      { label: "Playground", href: "/playground" },
      { label: "Project dashboard", href: "/projects" },
    ],
  },
  {
    key: "friend",
    label: "friend",
    emoji: "🫶",
    greeting:
      "Hey. Glad you swung by. /playground is where the fun stuff lives — that's probably the room you want. Email if you want to actually hang out instead of just checking my homepage.",
    routes: [
      { label: "Playground", href: "/playground" },
      { label: "Email", href: "/contact" },
    ],
  },
];

export function WhoAmIPrompt() {
  const [picked, setPicked] = useState<Identity | null>(null);

  return (
    <section
      aria-label="Visitor guide"
      className="overflow-hidden rounded-xl border border-bg-border bg-bg-panel font-mono text-sm"
    >
      <div className="flex items-center gap-2 border-b border-bg-border bg-bg-raised px-4 py-2 text-xs text-ink-muted">
        <span className="h-2.5 w-2.5 rounded-full bg-accent-red/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent-green/70" />
        <span className="ml-3">~/puddingsworld</span>
      </div>

      <div className="px-5 py-5">
        <div className="text-ink-secondary">
          <span className="text-accent-green">guest@puddingsworld</span>
          <span className="text-ink-muted">:</span>
          <span className="text-accent">~</span>
          <span className="text-ink-muted">$ </span>
          <span className="text-ink-primary">whoami</span>
        </div>

        {picked === null ? (
          <>
            <p className="mt-3 text-ink-secondary">
              Pick one. The page adjusts to who you are.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {IDENTITIES.map((id) => (
                <button
                  key={id.key}
                  type="button"
                  onClick={() => setPicked(id)}
                  className="rounded-md border border-bg-border bg-bg-raised px-3 py-1.5 text-ink-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="mr-1.5">{id.emoji}</span>
                  {id.label}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-muted">
              Tip: this is just a router. Nothing is sent anywhere.
            </p>
          </>
        ) : (
          <>
            <div className="mt-2 text-ink-primary">
              <span className="text-ink-muted">→ </span>
              <span className="mr-1.5">{picked.emoji}</span>
              {picked.label}
            </div>
            <p className="mt-4 leading-relaxed text-ink-secondary">
              {picked.greeting}
            </p>
            <ul className="mt-4 space-y-1.5">
              {picked.routes.map((r) => (
                <li key={r.label}>
                  {r.external ? (
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline"
                    >
                      → {r.label} ↗
                    </a>
                  ) : (
                    <Link href={r.href} className="text-accent hover:underline">
                      → {r.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-5 text-xs text-ink-muted transition-colors hover:text-ink-primary"
            >
              ← back
            </button>
          </>
        )}
      </div>
    </section>
  );
}
