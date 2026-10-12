import { LABEL_ONLY, isCapsHeading, titleCase } from "./grammar.ts";
import type { Para, Part } from "./types.ts";

function tidy(lines: string[]): string {
  return lines
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*\n/, "")
    .trim();
}

/** Cut lines into songs at the lines marked as headings. Text before the first heading keeps `fallback` as its title. */
export function splitParts(lines: string[], marked: boolean[], fallback: string): Part[] {
  const parts: { title: string; lines: string[] }[] = [];
  let cur = { title: "", lines: [] as string[] };
  const keep = (p: typeof cur) => p.title || p.lines.some((x) => x.trim());
  lines.forEach((l, i) => {
    if (marked[i]) {
      if (keep(cur)) parts.push(cur);
      cur = { title: titleCase(l), lines: [] };
    } else cur.lines.push(...l.split("\n"));
  });
  if (keep(cur)) parts.push(cur);
  return parts.map((p) => ({ title: p.title || fallback, text: tidy(p.lines) })).filter((p) => p.text);
}

/** Plain text (a paste or a .txt): headings are short lines in CAPITALS. */
export function partsFromText(text: string, fallback: string): Part[] {
  const lines = text.replace(/\r/g, "").split("\n");
  return splitParts(lines, lines.map(isCapsHeading), fallback);
}

/**
 * A Word document: headings use a Heading style or a font at least 25% bigger
 * than the lyrics. Only when the document has neither does it fall back to
 * CAPITALS, so lyrics typed in capitals don't split a well-formatted file.
 */
export function partsFromParas(paras: Para[], fallback: string): Part[] {
  const count = new Map<number, number>();
  for (const p of paras) if (p.text.trim() && p.size) count.set(p.size, (count.get(p.size) ?? 0) + 1);
  const bodySize = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 22;
  const isHeading = (p: Para): boolean => {
    const t = p.text.trim();
    if (!t || t.includes("\n") || t.length > 60 || LABEL_ONLY.test(t)) return false;
    return p.styleHeading || p.size >= bodySize * 1.25;
  };
  let marked = paras.map(isHeading);
  if (!marked.some(Boolean)) marked = paras.map((p) => isCapsHeading(p.text));
  return splitParts(
    paras.map((p) => p.text),
    marked,
    fallback,
  );
}
