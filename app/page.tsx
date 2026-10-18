import Image from "next/image";
import Link from "next/link";
import { ProjectCard } from "@/components/ProjectCard";
import { WhoAmIPrompt } from "@/components/WhoAmIPrompt";
import { loadProjects, pickFeatured } from "@/lib/projects";
import { now, type NowItem } from "@/content/now";
import { hueFor, initials, splitBold } from "@/lib/markup";

const NOW_VISIBLE = 4;

export default async function HomePage() {
  const { projects } = await loadProjects();
  const featured = pickFeatured(projects);
  const visibleNow = now.items.slice(0, NOW_VISIBLE);
  const hiddenNow = now.items.slice(NOW_VISIBLE);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="mb-10 inline-flex items-center gap-2 rounded-md border border-accent-amber/40 bg-accent-amber/10 px-3 py-1.5 font-mono text-xs text-accent-amber">
          <span aria-hidden>🛠</span>
          <span>in active iteration — content shifts week to week</span>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          puddingsworld
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Pudding builds the world.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-secondary">
          I build things — biosignal AI, surgical vision, audio tools, Android
          utilities, the occasional side quest. Some become products, some
          become papers, some stay weird.
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-secondary">
          {now.items.length} things in flight this week. Some are open source,
          some are commissioned, some are scratching personal itches.
        </p>
      </section>

      <section className="border-t border-bg-border pt-12 pb-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Now building</h2>
          <span className="font-mono text-xs text-ink-muted">
            updated {now.updated}
          </span>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {visibleNow.map((item) => (
            <NowCard key={item.title} item={item} />
          ))}
        </ul>
        {hiddenNow.length > 0 && (
          <details className="group mt-4">
            <summary className="cursor-pointer list-none rounded-md border border-bg-border bg-bg-panel px-4 py-2 text-center font-mono text-xs text-ink-secondary transition-colors hover:text-ink-primary">
              <span className="group-open:hidden">
                show {hiddenNow.length} more ↓
              </span>
              <span className="hidden group-open:inline">show less ↑</span>
            </summary>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {hiddenNow.map((item) => (
                <NowCard key={item.title} item={item} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="mx-auto max-w-2xl pb-16">
        <WhoAmIPrompt />
      </section>

      <section className="border-t border-bg-border pt-12 pb-16">
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
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <section className="border-t border-bg-border pt-12 pb-20">
        <div className="mx-auto max-w-2xl text-center sm:text-left">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            get in touch
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
            Reach me directly.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-secondary">
            Email is the fastest way. Mention rough scope, timeline, and budget
            if it&apos;s a project inquiry — that&apos;s how I tell you quickly
            whether I&apos;m a good fit.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="mailto:geniuspuddingforgames@gmail.com"
              className="rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-center font-mono text-sm text-accent transition-colors hover:bg-accent/20"
            >
              geniuspuddingforgames@gmail.com
            </a>
            <Link
              href="/contact"
              className="rounded-md border border-bg-border bg-bg-panel px-4 py-2 text-center font-mono text-sm text-ink-secondary transition-colors hover:text-ink-primary"
            >
              other ways →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function NowCard({ item }: { item: NowItem }) {
  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-bg-border bg-bg-panel">
      {item.image ? (
        <div className="relative aspect-video border-b border-bg-border bg-bg-raised">
          <Image
            src={item.image}
            alt={item.title}
            fill
            unoptimized
            className="object-cover object-top"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="flex h-14 items-center border-b border-bg-border px-5 font-mono text-lg font-semibold tracking-wider"
          style={{
            background: `linear-gradient(135deg, hsl(${hueFor(item.title)} 45% 18%), hsl(${(hueFor(item.title) + 40) % 360} 45% 12%))`,
            color: `hsl(${hueFor(item.title)} 70% 70%)`,
          }}
        >
          {initials(item.title)}
        </div>
      )}
      <div className="flex flex-col p-5">
        <h3 className="text-base font-semibold tracking-tight">
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-accent">
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
          {splitBold(item.note).map((seg, i) =>
            seg.bold ? (
              <strong key={i} className="font-semibold text-ink-primary">
                {seg.text}
              </strong>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )}
        </p>
      </div>
    </li>
  );
}
