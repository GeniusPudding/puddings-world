import Link from "next/link";

export const metadata = {
  title: "Services · puddingsworld",
  description: "Digitalization consulting and custom software development.",
};

const SERVICES = [
  {
    title: "Digitalization Consulting",
    summary:
      "Help small and mid-sized teams move paper-based or ad-hoc workflows onto modern tooling.",
    items: [
      "Audit current process and pain points",
      "Recommend tooling (off-the-shelf SaaS vs. custom build)",
      "Design data flow and integration plan",
      "Oversee implementation and team handover",
    ],
    bestFor:
      "Clinics, labs, and small operations whose work is bottlenecked on Excel, paper, or one person's brain.",
  },
  {
    title: "Custom Software Development",
    summary:
      "Build new web, mobile, or desktop software when off-the-shelf doesn't fit.",
    items: [
      "Web apps — Next.js, TypeScript, Tailwind",
      "Android apps — Kotlin / Jetpack Compose",
      "ML / signal processing pipelines — Python",
      "Internal CLI and automation tooling",
    ],
    bestFor:
      "Teams with a specific workflow that off-the-shelf tools can only 70% solve.",
  },
  {
    title: "Software Modification & Maintenance",
    summary:
      "Take over, refactor, or extend existing internal tools and open-source codebases.",
    items: [
      "Adopt and stabilize legacy code",
      "Performance and scaling work",
      "Custom forks of open-source projects",
      "Integration with new systems or models",
    ],
    bestFor:
      "Teams stuck on a code base nobody wants to touch, or who need an OSS project bent to fit their case.",
  },
];

export default function ServicesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          services
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Independent engineering, on retainer or per-project.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-secondary">
          I take on a small number of outside engagements alongside my own
          research. Engagements range from 2-week scoped builds to multi-month
          collaborations. Below are the three shapes most of my work tends to
          fall into — if your problem looks adjacent, get in touch.
        </p>
      </header>

      <div className="mt-12 space-y-8">
        {SERVICES.map((service) => (
          <article
            key={service.title}
            className="rounded-xl border border-bg-border bg-bg-panel p-6 sm:p-8"
          >
            <h2 className="text-xl font-semibold tracking-tight">
              {service.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-secondary">
              {service.summary}
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-ink-secondary">
              {service.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-bg-border pt-4 text-xs text-ink-muted">
              <span className="font-mono uppercase tracking-wider">Best for </span>
              {service.bestFor}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-16 rounded-xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Looking for something else?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-secondary">
          Not every engagement fits these three shapes. If you have a research
          collaboration, a one-off prototype, or a question about whether a
          problem is even worth automating — reach out and we can figure it
          out together.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-md border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/20"
        >
          Get in touch →
        </Link>
      </section>
    </main>
  );
}
