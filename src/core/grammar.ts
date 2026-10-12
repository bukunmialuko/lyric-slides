// The one definition of what lyrics markup looks like. split.ts, parts.ts and
// title.ts all read from here; a second definition would drift.

const SECTION = "verse|chorus|refrain|bridge|pre[- ]?chorus|tag|outro|intro|ending|vamp|hook|interlude|coda|chant|response|call";

const NUMBER = "(?:\\s*(?:\\d+[a-z]?|one|two|three|four|five|six))?";

/**
 * A line that is only a section name: `Verse 1`, `[Chorus]`, `Bridge:`, `Verse Two`.
 * Nothing may follow the name and number, or `Chorus: Holy, holy` would lose its lyrics.
 */
export const LABEL_ONLY = new RegExp(`^[\\[(]?\\s*((?:${SECTION})${NUMBER})\\s*[\\])]?\\s*:?\\s*$`, "i");

/** A section name followed by lyrics on the same line: `Chorus: Holy, holy`. */
export const LABEL_INLINE = new RegExp(`^((?:${SECTION})${NUMBER})\\s*[:\\-–]\\s*(.+)$`, "i");

/** A repeat marker at the end of a line: `(x2)`, `x3`, `[2x]`. */
export const REPEAT = /\s*[\[(]?\s*(?:[x×]\s*(\d+)|(\d+)\s*[x×])\s*[\])]?\s*$/i;

/** Split a repeat marker off a line. Returns the remaining text and the count (1 if none). */
export function takeRepeat(line: string): [string, number] {
  const m = line.match(REPEAT);
  if (!m || m.index === undefined) return [line, 1];
  return [line.slice(0, m.index).trim(), Number(m[1] || m[2])];
}

/** Collapse every kind of whitespace (Word's thin and no-break spaces included) to one space. */
export const squash = (s: string): string => s.replace(/\s+/g, " ").trim();

/** `FIRST PRAISE` → `First Praise`. Mixed-case text is left alone. */
export function titleCase(s: string): string {
  const t = squash(s);
  return t === t.toUpperCase() ? t.toLowerCase().replace(/(^|\s|-)([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase()) : t;
}

/**
 * A short line in capitals that names a song or set, like `MIDDLE SET`.
 * Section names (VERSE, CHORUS) and repeat markers are not headings.
 */
export function isCapsHeading(line: string): boolean {
  const s = squash(line);
  return (
    s.length >= 3 &&
    s.length <= 40 &&
    s.split(" ").length <= 6 &&
    /[A-Z].*[A-Z]/.test(s) &&
    s === s.toUpperCase() &&
    !/[,;!?.]/.test(s) &&
    !LABEL_ONLY.test(s) &&
    !/^[\[(]?\s*[x×]?\s*\d/i.test(s)
  );
}
