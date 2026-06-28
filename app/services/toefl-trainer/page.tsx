import Link from "next/link";

export const metadata = {
  title: "TOEFL Daily Trainer · puddingsworld",
  description:
    "Daily TOEFL iBT practice tool — reading, listening, speaking, writing, vocabulary. Installable PWA, works offline.",
};

const FEATURES = [
  {
    icon: "📅",
    title: "Today view — automatic daily plan",
    desc: "Detects which week of the 8-week phase you are in and shows exactly the 5 tasks you need to do today.",
  },
  {
    icon: "🔔",
    title: "Daily reminders",
    desc: "Browser notifications nudge you at 8 PM if you have not completed today's tasks. Optional, opt-in.",
  },
  {
    icon: "📱",
    title: "Install as app on any device",
    desc: "Progressive Web App — installs on iPhone, Android, Windows, Mac. Works offline after first load.",
  },
  {
    icon: "🎯",
    title: "Customized to your level",
    desc: "Difficulty adapts to your baseline: Reading B2, Listening B1-B2, Speaking A2, Writing A2-B1. Targets 5.0/6.0 by March 2027.",
  },
  {
    icon: "📚",
    title: "Built-in content",
    desc: "60+ academic vocabulary cards with spaced repetition. Real TOEFL-format reading passages, writing/speaking prompts, listening drills.",
  },
  {
    icon: "🔥",
    title: "Streak tracking",
    desc: "Local progress storage. Miss a day, streak resets. Daily checkbox UI keeps you honest.",
  },
];

const WEEKS = [
  {
    label: "Weeks 1–2",
    title: "Foundation 🏗",
    desc: "Vocabulary, sentence patterns, listening warm-up. Shadowing only (no original output yet).",
  },
  {
    label: "Weeks 3–4",
    title: "Templates 📝",
    desc: "Memorize speaking/writing formulas. Start producing original output.",
  },
  {
    label: "Weeks 5–6",
    title: "Integrated 🎯",
    desc: "Full TOEFL-format sections, dictation drills, timed practice.",
  },
  {
    label: "Weeks 7–8",
    title: "Mock & Refine 🏆",
    desc: "Full mock tests, weak-spot remediation, ETS official sample test.",
  },
];

export default function ToeflTrainerPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          services · personal tool
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          TOEFL Daily Trainer
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
          A self-hosted, no-account, no-paywall practice tool for the 2026
          TOEFL iBT format. Built for a 9-month grind from baseline to 5.0/6.0.
          Installable on any device, works offline.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/toefl/"
            className="inline-flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-5 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/20"
          >
            Open Trainer →
          </Link>
          <a
            href="/toefl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-bg-border px-5 py-3 font-mono text-sm text-ink-secondary transition-colors hover:border-ink-primary hover:text-ink-primary"
          >
            Open in new tab ↗
          </a>
        </div>
      </header>

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight">Features</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-bg-border bg-bg-panel p-5"
            >
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 text-base font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                {f.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight">
          8-Week Phase Structure
        </h2>
        <p className="mt-3 text-sm text-ink-secondary">
          The trainer auto-detects your current week and surfaces only the
          tasks for that phase. After Week 8, re-diagnose with ETS official
          sample test, then start the next cycle.
        </p>
        <div className="mt-6 space-y-3">
          {WEEKS.map((w) => (
            <div
              key={w.label}
              className="flex items-start gap-4 rounded-xl border border-bg-border bg-bg-panel p-5"
            >
              <span className="font-mono text-xs uppercase tracking-wider text-accent whitespace-nowrap">
                {w.label}
              </span>
              <div>
                <h3 className="text-base font-semibold tracking-tight">
                  {w.title}
                </h3>
                <p className="mt-1 text-sm text-ink-secondary">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Install as a real app
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          The trainer is a Progressive Web App. After opening it once, you can
          install it on any device:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-ink-secondary">
          <li className="flex gap-2">
            <span className="text-accent">·</span>
            <span>
              <strong>iPhone (Safari)</strong> — Share button → Add to Home
              Screen
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">·</span>
            <span>
              <strong>Android (Chrome)</strong> — Install banner appears, or
              menu → Install app
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent">·</span>
            <span>
              <strong>Windows / Mac (Chrome / Edge)</strong> — Install icon in
              address bar
            </span>
          </li>
        </ul>
        <p className="mt-5 text-xs text-ink-muted">
          Note: This tool currently lives under <code>/services</code> while it
          is in active use by one person. It may move to <code>/personal</code>{" "}
          later.
        </p>
      </section>
    </main>
  );
}
