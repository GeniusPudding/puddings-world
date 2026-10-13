import Image from "next/image";

type Props = {
  src?: string;
  caption?: string;
  title: string;
};

export function ProjectVisual({ src, caption, title }: Props) {
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

  return null;
}
