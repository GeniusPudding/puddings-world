import type { Metadata } from "next";
import { MusingsLab } from "@/components/MusingsLab";

export const metadata: Metadata = {
  title: "musings lab",
  robots: { index: false, follow: false },
};

export default function MusingsLabPage() {
  return (
    <main className="w-full py-16">
      <header className="mx-auto mb-10 w-full max-w-3xl px-4 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">musings lab</p>
        <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          Preview Google Docs as musings
        </h1>
        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-secondary">
          <li>Share each doc or folder as &ldquo;Anyone with the link: Viewer&rdquo;.</li>
          <li>Lyrics: one song per doc, or start each song with a heading or a <code>---</code> line.</li>
          <li>Sayings: one per paragraph or bullet; a line starting with &ldquo;—&rdquo; is its context.</li>
          <li>A line holding only a date (2023-05-01, or 日期：2023) dates the piece.</li>
          <li>Nothing here is published. Links stay in this browser only.</li>
        </ul>
      </header>
      <MusingsLab />
    </main>
  );
}
