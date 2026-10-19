// Turns Google Docs shared as "anyone with the link can view" into musings.
// Fetching lives in lib/gdocs-fetch.ts; everything here is pure.

export type DocRef = { kind: "doc" | "folder"; id: string };
export type SourceKind = "lyrics" | "sayings" | "auto";

export type ParsedPiece = { title?: string; date?: string; audio?: string; body: string };
export type ParsedSaying = { text: string; date?: string; context?: string };

const ID = "([A-Za-z0-9_-]{10,})";

/** Accepts Docs/Drive share links (or a bare id) and returns what they point at. */
export function parseDocUrl(raw: string): DocRef | null {
  const s = raw.trim();
  if (/^[A-Za-z0-9_-]{20,}$/.test(s)) return { kind: "doc", id: s };
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname === "docs.google.com") {
    const m = url.pathname.match(new RegExp(`/document/(?:u/\\d+/)?d/${ID}`));
    return m ? { kind: "doc", id: m[1] } : null;
  }
  if (url.hostname === "drive.google.com") {
    const folder = url.pathname.match(new RegExp(`/drive/(?:u/\\d+/)?folders/${ID}`));
    if (folder) return { kind: "folder", id: folder[1] };
    const file = url.pathname.match(new RegExp(`/file/(?:u/\\d+/)?d/${ID}`));
    if (file) return { kind: "doc", id: file[1] };
    const open = url.searchParams.get("id");
    if (open && new RegExp(`^${ID}$`).test(open)) return { kind: "doc", id: open };
  }
  return null;
}

/** Doc title from an export response's Content-Disposition header. */
export function titleFromDisposition(header: string | null): string | undefined {
  if (!header) return undefined;
  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  let name: string | undefined;
  if (star) {
    try {
      name = decodeURIComponent(star[1]);
    } catch {
      name = undefined;
    }
  }
  name ??= header.match(/filename="([^"]+)"/i)?.[1];
  return name ? cleanTitle(name) : undefined;
}

/** Drops export and upload extensions and a trailing 歌詞 / lyrics label. */
export function cleanTitle(name: string): string | undefined {
  return (
    name
      .replace(/\.(md|txt)$/i, "")
      .replace(/\.(docx?|odt|rtf)$/i, "")
      .replace(/\s*[（(]?\s*(?:歌詞|lyrics)\s*[)）]?\s*$/i, "")
      .trim() || undefined
  );
}

const squash = (s: string) => s.replace(/[\s　]+/g, "").toLowerCase();

const AUDIO_LINE = /^\s*(?:audio|mp3|demo|音檔|音樂|錄音)\s*[:：]\s*(.+?)\s*$/i;

/**
 * Playable URL for an `audio:` line: Drive file links become direct
 * downloads, other https URLs pass through, anything else is dropped.
 */
export function audioUrl(line: string): string | undefined {
  const raw = line.match(/\]\((https?:[^)\s]+)\)/)?.[1] ?? line.replace(/^<|>$/g, "");
  const ref = parseDocUrl(raw);
  if (ref?.kind === "doc" && raw.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=download&id=${ref.id}`;
  }
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

const SEPARATOR = /^\s*(?:-{3,}|\*{3,}|_{3,}|＊{3,}|={3,})\s*$/;
const HEADING = /^\s*#{1,6}\s+(.+?)\s*#*\s*$/;
const DATE_LINE = /^\s*(?:date|日期)?\s*[:：]?\s*(\d{4}(?:[-./]\d{1,2}){0,2})\s*$/i;

/** Normalizes Docs markdown export noise: escapes, bold/italic marks, CRLF, nbsp. */
export function cleanDocText(raw: string): string {
  return raw
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/\\([\\`*_{}[\]()#+\-.!~>|])/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*/g, "$1$2")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function normalizeDate(raw: string): string {
  return raw.replace(/[./]/g, "-");
}

function splitBlocks(text: string): string[][] {
  const blocks: string[][] = [[]];
  for (const line of text.split("\n")) {
    if (SEPARATOR.test(line) || (HEADING.test(line) && blocks.at(-1)!.some((l) => l.trim()))) {
      blocks.push([]);
      if (SEPARATOR.test(line)) continue;
    }
    blocks.at(-1)!.push(line);
  }
  return blocks;
}

/**
 * One doc may hold one song or several. A heading (`# 歌名`) or a `---` line
 * starts a new song; a lone date line (`2023-05-01`, `日期：2023`) anywhere in
 * a song becomes its date, and an `audio: <url>` line its recording. Without
 * any heading the doc title names the song, and a first line that just
 * repeats that title is dropped.
 */
export function parseLyrics(raw: string, docTitle?: string): ParsedPiece[] {
  const text = cleanDocText(raw);
  const blocks = splitBlocks(text);
  const pieces: ParsedPiece[] = [];
  for (const block of blocks) {
    let title: string | undefined;
    let date: string | undefined;
    let audio: string | undefined;
    const body: string[] = [];
    for (const line of block) {
      const a = line.match(AUDIO_LINE);
      if (a && !audio) {
        audio = audioUrl(a[1]);
        continue;
      }
      const h = line.match(HEADING);
      if (h && !title && !body.some((l) => l.trim())) {
        title = h[1];
        continue;
      }
      const d = line.match(DATE_LINE);
      if (d && !date) {
        date = normalizeDate(d[1]);
        continue;
      }
      body.push(line);
    }
    const joined = body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!joined) continue;
    pieces.push({
      ...(title ? { title } : {}),
      ...(date ? { date } : {}),
      ...(audio ? { audio } : {}),
      body: joined,
    });
  }
  if (pieces.length === 1 && !pieces[0].title && docTitle) {
    const only = pieces[0];
    only.title = docTitle;
    const [first, ...rest] = only.body.split("\n");
    if (squash(first) === squash(docTitle)) only.body = rest.join("\n").trim();
  }
  return pieces.filter((p) => p.body);
}

const BULLET = /^\s*(?:[-*•・]|\d+[.)、])\s+/;
const ATTRIBUTION = /^\s*(?:—|──|--|－－|——)\s*(.+)$/;

/**
 * Sayings: one per paragraph or list item. A line starting with `—` under a
 * saying is its context; a lone date line is its date. Headings are ignored.
 */
export function parseSayings(raw: string): ParsedSaying[] {
  const text = cleanDocText(raw);
  const out: ParsedSaying[] = [];
  let current: string[] = [];
  let date: string | undefined;
  let context: string | undefined;
  const flush = () => {
    const t = current.join("\n").trim();
    if (t) out.push({ text: t, ...(date ? { date } : {}), ...(context ? { context } : {}) });
    current = [];
    date = undefined;
    context = undefined;
  };
  for (const line of text.split("\n")) {
    if (!line.trim() || SEPARATOR.test(line) || HEADING.test(line)) {
      flush();
      continue;
    }
    const attribution = line.match(ATTRIBUTION);
    const d = line.match(DATE_LINE);
    if (attribution && current.length) {
      context = attribution[1].trim();
      const inner = context.match(/(?:^|[,，、\s])(\d{4}(?:[-./]\d{1,2}){0,2})\s*$/);
      if (inner) {
        date = normalizeDate(inner[1]);
        context = context.slice(0, inner.index).replace(/[,，、\s]+$/, "") || undefined;
      }
      continue;
    }
    if (d && current.length) {
      date = normalizeDate(d[1]);
      continue;
    }
    if (BULLET.test(line)) {
      flush();
      current.push(line.replace(BULLET, ""));
      continue;
    }
    current.push(line);
  }
  flush();
  return out;
}

/** Docs with headings or separators read as lyrics, everything else as sayings. */
export function guessKind(raw: string): "lyrics" | "sayings" {
  const lines = cleanDocText(raw).split("\n");
  return lines.some((l) => HEADING.test(l) || SEPARATOR.test(l)) ? "lyrics" : "sayings";
}

/** File entries of a public folder's `embeddedfolderview` page. */
export function parseFolderListing(html: string): { id: string; title: string; isDoc: boolean }[] {
  const out: { id: string; title: string; isDoc: boolean }[] = [];
  const seen = new Set<string>();
  const entry = /<div class="flip-entry" id="entry-([A-Za-z0-9_-]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([\s\S]*?)<\/div>/g;
  for (const m of html.matchAll(entry)) {
    const [, id, href, title] = m;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, title: decodeEntities(title.trim()), isDoc: href.includes("docs.google.com/document/") });
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
