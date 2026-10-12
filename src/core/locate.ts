import type { BuiltSection, Range } from "./types.ts";

const WORD = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Map every slide back to the characters it came from in the original lyrics,
 * so the editor can highlight them.
 *
 * Words are matched in order, ignoring case and punctuation. That works because
 * splitting only moves line breaks, capitalises a first letter and drops
 * trailing commas — it never changes a word. Repeated sections point at the
 * same source as their first appearance.
 */
export function locateSlides(text: string, res: BuiltSection[]): Range[] {
  const out: Range[] = [];
  const seen = new Map<string[][], Range[]>();
  let cursor = 0;

  for (const sec of res) {
    const prior = seen.get(sec.slides);
    if (prior) {
      out.push(...prior);
      continue;
    }
    const ranges = sec.slides.map((lines): Range => {
      let s = -1;
      let e = -1;
      for (const line of lines) {
        const words = line.match(WORD);
        if (!words) continue;
        const re = new RegExp(words.map(escape).join("[^\\p{L}\\p{N}]+"), "giu");
        re.lastIndex = cursor;
        const m = re.exec(text);
        if (!m) continue;
        if (s < 0) s = m.index;
        e = m.index + m[0].length;
        cursor = e;
      }
      return s < 0 ? null : [s, e];
    });
    seen.set(sec.slides, ranges);
    out.push(...ranges);
  }
  return out;
}
