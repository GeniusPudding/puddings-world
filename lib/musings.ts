import { musingSources } from "@/content/musing-sources";
import { type Musing, musings, type Saying, sayings } from "@/content/musings";
import { type LoadedDoc, loadSource, type MusingSource } from "./gdocs-fetch";

const EXCERPT_LINES = 12;

/** First stanzas of a song, cut at a stanza break, for the carousel card. */
export function excerptOf(body: string): string | undefined {
  const lines = body.split("\n");
  if (lines.length <= EXCERPT_LINES + 2) return undefined;
  let cut = EXCERPT_LINES;
  for (let i = EXCERPT_LINES; i >= 4; i--) {
    if (!lines[i]?.trim()) {
      cut = i;
      break;
    }
  }
  return lines.slice(0, cut).join("\n").trim();
}

export function docsToMusings(docs: LoadedDoc[]): { musings: Musing[]; sayings: Saying[] } {
  const out: Musing[] = [];
  const said: Saying[] = [];
  for (const doc of docs) {
    doc.pieces.forEach((p, i) => {
      const excerpt = excerptOf(p.body);
      out.push({
        slug: `${doc.id.slice(0, 12)}-${i + 1}`,
        type: "lyrics",
        ...(p.title ? { title: p.title } : {}),
        ...(p.date ? { date: p.date } : {}),
        ...(p.audio ? { audio: p.audio } : {}),
        body: p.body,
        ...(excerpt ? { excerpt } : {}),
      });
    });
    said.push(...doc.sayings);
  }
  return { musings: out, sayings: said };
}

export function sortByDateDesc(a: { date?: string }, b: { date?: string }) {
  return (b.date ?? "").localeCompare(a.date ?? "");
}

/** Hand-written pieces plus everything the listed Google Docs hold right now. */
export async function loadMusings(sources: MusingSource[] = musingSources) {
  const results = await Promise.all(sources.map((s) => loadSource(s)));
  for (const r of results) if (r.error) console.warn(`musings: ${r.url}: ${r.error}`);
  const remote = docsToMusings(results.flatMap((r) => r.docs));
  return {
    musings: [...musings, ...remote.musings].sort(sortByDateDesc),
    sayings: [...sayings, ...remote.sayings].sort(sortByDateDesc),
  };
}
