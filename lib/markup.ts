export type Segment = { text: string; bold: boolean };

/**
 * Split a note into plain and bold runs. Only `**bold**` is supported; an
 * unclosed `**` is rendered literally so a typo never swallows the rest of
 * the sentence.
 */
export function splitBold(text: string): Segment[] {
  const out: Segment[] = [];
  let rest = text;
  while (rest.length > 0) {
    const open = rest.indexOf("**");
    if (open === -1) break;
    const close = rest.indexOf("**", open + 2);
    if (close === -1) break;
    if (open > 0) out.push({ text: rest.slice(0, open), bold: false });
    const inner = rest.slice(open + 2, close);
    if (inner.length > 0) out.push({ text: inner, bold: true });
    rest = rest.slice(close + 2);
  }
  if (rest.length > 0) out.push({ text: rest, bold: false });
  return out;
}

/** Stable hue (0–359) for a label, so a monogram tile keeps its colour across builds. */
export function hueFor(label: string): number {
  let h = 0;
  for (const ch of label) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h % 360;
}

/** Up to two initials for a monogram tile: "paper-daily" → "PD", "This site" → "TS", "Mapetite" → "M". */
export function initials(label: string): string {
  const words = label.split(/[\s\-_/]+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0]!.toUpperCase());
  return letters.join("") || "?";
}
