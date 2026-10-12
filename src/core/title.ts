import { LABEL_ONLY, titleCase } from "./grammar.ts";

const TITLE_PREFIX = /^(title|song)\s*[:\-–]\s*/i;

/**
 * Pull a title off the first line of pasted lyrics. It must be short, have no
 * commas, not be a section name, and stand out: written as `Title: …`, in
 * capitals, or followed by a blank line.
 */
export function extractTitle(text: string): { title: string; rest: string } | null {
  const lines = text.replace(/\r/g, "").split("\n");
  const i = lines.findIndex((l) => l.trim());
  if (i < 0) return null;
  const first = lines[i].trim();
  const explicit = TITLE_PREFIX.test(first);
  const caps = first === first.toUpperCase() && /[A-Z]/.test(first);
  const blankAfter = (lines[i + 1] ?? "").trim() === "";
  if (first.length > 60 || /[,;]/.test(first.replace(TITLE_PREFIX, "")) || LABEL_ONLY.test(first)) return null;
  if (!(explicit || caps || blankAfter)) return null;
  const title = titleCase(first.replace(TITLE_PREFIX, "").replace(/^["'“‘]+|["'”’]+$/g, ""));
  if (!title) return null;
  return { title, rest: lines.slice(i + 1).join("\n").replace(/^\s*\n/, "") };
}
