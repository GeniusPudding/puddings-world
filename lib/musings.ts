import { musingSources } from "@/content/musing-sources";
import { type Musing, musings, type Saying, sayings } from "@/content/musings";
import { type LoadedDoc, loadSource, type MusingSource } from "./gdocs-fetch";

const HOOK_LINES = 2;

const squash = (s: string) => s.replace(/[\s　]+/g, "");

/**
 * The couple of lines a lyrics card shows on its cover: the line the song
 * repeats most (its hook) with the line after it, or the opening lines when
 * nothing repeats.
 */
export function hookOf(body: string): string {
  const stanzas = body
    .split(/\n\s*\n/)
    .map((s) => s.split("\n").map((l) => l.trim()).filter(Boolean));
  const counts = new Map<string, number>();
  for (const line of stanzas.flat()) counts.set(squash(line), (counts.get(squash(line)) ?? 0) + 1);
  const best = Math.max(0, ...counts.values());
  if (best > 1) {
    for (const stanza of stanzas) {
      const i = stanza.findIndex((l) => counts.get(squash(l)) === best);
      if (i !== -1) return stanza.slice(i, i + HOOK_LINES).join("\n");
    }
  }
  return (stanzas[0] ?? []).slice(0, HOOK_LINES).join("\n");
}

export type Stanza = { text: string; repeated: boolean };

/** A song's stanzas, flagging the ones it sings more than once (its chorus). */
export function stanzasOf(body: string): Stanza[] {
  const texts = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Map<string, number>();
  for (const t of texts) seen.set(squash(t), (seen.get(squash(t)) ?? 0) + 1);
  return texts.map((text) => ({ text, repeated: (seen.get(squash(text)) ?? 0) > 1 }));
}

export function docsToMusings(docs: LoadedDoc[]): { musings: Musing[]; sayings: Saying[] } {
  const out: Musing[] = [];
  const said: Saying[] = [];
  for (const doc of docs) {
    doc.pieces.forEach((p, i) => {
      out.push({
        slug: `${doc.id.slice(0, 12)}-${i + 1}`,
        type: "lyrics",
        ...(p.title ? { title: p.title } : {}),
        ...(p.date ? { date: p.date } : {}),
        ...(p.audio ? { audio: p.audio } : {}),
        body: p.body,
        hook: p.hook ?? hookOf(p.body),
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
