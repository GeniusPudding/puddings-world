import { NextResponse } from "next/server";
import type { SourceKind } from "@/lib/gdocs";
import { loadSource } from "@/lib/gdocs-fetch";
import { docsToMusings } from "@/lib/musings";

const MAX_SOURCES = 20;
const KINDS: SourceKind[] = ["lyrics", "sayings", "auto"];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { sources?: unknown } | null;
  if (!Array.isArray(body?.sources)) {
    return NextResponse.json({ error: "Expected { sources: [...] }." }, { status: 400 });
  }
  const sources = body.sources
    .slice(0, MAX_SOURCES)
    .flatMap((s: unknown) => {
      const { url, kind } = (s ?? {}) as { url?: unknown; kind?: unknown };
      if (typeof url !== "string" || !url.trim()) return [];
      return [{ url: url.trim(), kind: KINDS.includes(kind as SourceKind) ? (kind as SourceKind) : "auto" }];
    });

  const results = await Promise.all(sources.map((s) => loadSource(s, { fresh: true })));
  return NextResponse.json({
    sources: results.map((r) => ({
      url: r.url,
      error: r.error,
      docs: r.docs.map((d) => ({
        title: d.title,
        kind: d.kind,
        pieces: d.pieces.length,
        sayings: d.sayings.length,
      })),
    })),
    ...docsToMusings(results.flatMap((r) => r.docs)),
  });
}
