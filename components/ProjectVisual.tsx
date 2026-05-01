import Image from "next/image";

type Props = {
  src?: string;
  caption?: string;
  title: string;
  slug: string;
};

export function ProjectVisual({ src, caption, title, slug }: Props) {
  if (src) {
    return (
      <figure>
        <div className="relative aspect-video overflow-hidden rounded-xl border border-bg-border bg-bg-panel">
          <Image
            src={src}
            alt={title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 768px, 100vw"
          />
        </div>
        {caption && (
          <figcaption className="mt-3 text-center text-xs text-ink-muted">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed border-bg-border bg-bg-panel/40 px-6 text-center">
      <div className="font-mono text-3xl text-ink-muted">⊟</div>
      <div className="mt-3 font-mono text-sm text-ink-secondary">
        visualization tbd
      </div>
      <div className="mt-1 max-w-md font-mono text-xs text-ink-muted">
        drop a hero image at{" "}
        <code className="text-ink-secondary">public/projects/{slug}.png</code>
        {" "}and set{" "}
        <code className="text-ink-secondary">image: &quot;/projects/{slug}.png&quot;</code>
        {" "}on this project in <code className="text-ink-secondary">content/projects.ts</code>
      </div>
    </div>
  );
}
