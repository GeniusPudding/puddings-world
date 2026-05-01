import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { WhoAmIPrompt } from "@/components/WhoAmIPrompt";
import { tracks } from "@/content/projects";
import { loadActivity } from "@/lib/activity";

const FEATURED_SLUGS = ["flowfusion-bp", "surgery-ocr", "invisible-go"];

export default async function HomePage() {
  const activity = await loadActivity();
  const allProjects = tracks.flatMap((t) => t.projects);
  const featured = FEATURED_SLUGS
    .map((slug) => allProjects.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const activeCount = allProjects.filter((p) => p.status === "active").length;

  return (
    <main className="mx-auto w-full max-w-6xl px-6">
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          puddingsworld
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          A workshop, not a portfolio.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-secondary">
          I build things — biosignal AI, surgical vision, audio tools, Android
          utilities, the occasional side quest. Some become products, some
          become papers, some stay weird.
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
          Currently {activeCount} active build{activeCount === 1 ? "" : "s"} in
          flight. Some are open source, some are commissioned, some are
          scratching personal itches.
        </p>
      </section>

      <section className="mx-auto max-w-2xl pb-16">
        <WhoAmIPrompt />
      </section>

      <section className="border-t border-bg-border pt-12 pb-20">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Featured</h2>
          <Link
            href="/projects"
            className="font-mono text-xs text-ink-muted hover:text-accent"
          >
            view all →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((project) => (
            <ProjectCard key={project.slug} project={project} activity={activity} />
          ))}
        </div>
      </section>
    </main>
  );
}
