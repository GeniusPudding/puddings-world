import {
  type DocRef,
  guessKind,
  parseDocUrl,
  parseFolderListing,
  parseLyrics,
  type ParsedPiece,
  type ParsedSaying,
  parseSayings,
  type SourceKind,
  titleFromDisposition,
} from "./gdocs";

/** How long a fetched doc is cached before the next visit re-reads it. */
export const DOC_REVALIDATE_SEC = 600;
const MAX_FOLDER_DOCS = 60;
const MAX_DOC_BYTES = 500_000;

export type MusingSource = { url: string; kind: SourceKind; label?: string };

export type LoadedDoc = {
  id: string;
  title?: string;
  kind: "lyrics" | "sayings";
  pieces: ParsedPiece[];
  sayings: ParsedSaying[];
};

export type SourceResult = {
  url: string;
  docs: LoadedDoc[];
  error?: string;
};

const NOT_SHARED =
  "Can't read it. Share the doc (or folder) as \"Anyone with the link: Viewer\".";

/** `fresh` skips the cache, for previews right after an edit. */
type FetchOpts = { fresh?: boolean };

const cacheInit = ({ fresh }: FetchOpts): RequestInit =>
  fresh ? { cache: "no-store" } : { next: { revalidate: DOC_REVALIDATE_SEC } };

async function exportDoc(id: string, format: "md" | "txt", opts: FetchOpts) {
  const res = await fetch(
    `https://docs.google.com/document/d/${id}/export?format=${format}`,
    cacheInit(opts),
  );
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || type.includes("text/html")) return null;
  const text = await res.text();
  if (text.length > MAX_DOC_BYTES) throw new Error("Doc is too large (over 500 KB of text).");
  return { text, title: titleFromDisposition(res.headers.get("content-disposition")) };
}

export async function loadDoc(
  id: string,
  kind: SourceKind,
  opts: FetchOpts = {},
  fallbackTitle?: string,
): Promise<LoadedDoc> {
  const exported = (await exportDoc(id, "md", opts)) ?? (await exportDoc(id, "txt", opts));
  if (!exported) throw new Error(NOT_SHARED);
  const title = exported.title ?? fallbackTitle;
  const resolved = kind === "auto" ? guessKind(exported.text) : kind;
  return {
    id,
    title,
    kind: resolved,
    pieces: resolved === "lyrics" ? parseLyrics(exported.text, title) : [],
    sayings: resolved === "sayings" ? parseSayings(exported.text) : [],
  };
}

async function listFolder(id: string, opts: FetchOpts) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, cacheInit(opts));
  if (!res.ok) throw new Error(NOT_SHARED);
  const entries = parseFolderListing(await res.text());
  return entries.filter((e) => e.isDoc).slice(0, MAX_FOLDER_DOCS);
}

async function loadRef(ref: DocRef, kind: SourceKind, opts: FetchOpts): Promise<LoadedDoc[]> {
  if (ref.kind === "doc") return [await loadDoc(ref.id, kind, opts)];
  const files = await listFolder(ref.id, opts);
  if (files.length === 0) throw new Error("No Google Docs found in that folder (or it isn't shared).");
  const settled = await Promise.allSettled(files.map((f) => loadDoc(f.id, kind, opts, f.title)));
  return settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
}

export async function loadSource(source: MusingSource, opts: FetchOpts = {}): Promise<SourceResult> {
  const ref = parseDocUrl(source.url);
  if (!ref) return { url: source.url, docs: [], error: "Not a Google Docs or Drive folder link." };
  try {
    return { url: source.url, docs: await loadRef(ref, source.kind, opts) };
  } catch (err) {
    return { url: source.url, docs: [], error: err instanceof Error ? err.message : String(err) };
  }
}
