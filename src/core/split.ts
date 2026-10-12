import { LABEL_INLINE, LABEL_ONLY, squash, takeRepeat } from "./grammar.ts";
import type { BuiltSection, Section, SplitOptions } from "./types.ts";

/**
 * Read lyrics into sections. Blank lines separate sections, label lines name
 * them, and repeat markers set how many times they are sung.
 */
export function toSections(text: string): Section[] {
  const out: Section[] = [];
  let cur: Section | null = null;
  const start = (label = ""): Section => {
    cur = { label, lines: [], times: 1 };
    out.push(cur);
    return cur;
  };

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = squash(raw);
    if (!line) {
      cur = null;
      continue;
    }
    let [body, n] = takeRepeat(line);
    if (!body) {
      // a marker on its own line repeats the section it follows
      if (cur) (cur as Section).times = Math.max((cur as Section).times, n);
      continue;
    }
    if (body.length <= 30 && LABEL_ONLY.test(body)) {
      start(body.replace(/[\[\]():]/g, "").trim()).times = n;
      continue;
    }
    const inline = body.match(LABEL_INLINE);
    if (inline) {
      start(inline[1].trim());
      body = inline[2].trim();
    }
    const sec: Section = cur ?? start();
    if (n > 1 && sec.lines.length === 0 && !inline) sec.times = n;

    // Word sometimes wraps early and leaves one lowercase word on its own line.
    const last = sec.lines[sec.lines.length - 1];
    if (last && /^[a-z][a-z’']*[.,!?]?$/.test(body) && !/[.,!?;:)\]]$/.test(last)) {
      sec.lines[sec.lines.length - 1] = `${last} ${body}`;
      continue;
    }
    sec.lines.push(body);
  }
  return out.filter((s) => s.lines.length);
}

/** Break a phrase with no punctuation into roughly equal lines of at most `max` characters. */
export function wrapBalanced(s: string, max: number): string[] {
  const words = s.split(" ");
  const k = Math.ceil(s.length / max);
  if (k <= 1 || words.length < 2) return [s];
  const target = s.length / k;
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && next.length > target + 4 && lines.length < k - 1) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Cut a line after each breaking punctuation mark, keeping the mark. */
export function fragments(line: string, punct: string): string[] {
  const cls = punct.replace(/[-\]\\^]/g, "\\$&");
  return (line.match(new RegExp(`[^${cls}]+[${cls}]*`, "g")) ?? []).map((f) => f.trim()).filter(Boolean);
}

function finishLine(s: string, o: SplitOptions): string {
  let t = s.trim();
  if (o.stripEnd) t = t.replace(/[,;:]+$/, "");
  if (o.cap) t = t.replace(/^(["'“‘(]*)([a-z])/, (_, p: string, c: string) => p + c.toUpperCase());
  return t;
}

/** Turn one source line into projected lines. Words are never changed, only where lines break. */
export function lineBreak(src: string, o: SplitOptions): string[] {
  const out: string[] = [];
  const push = (s: string) => wrapBalanced(s, o.maxChars).forEach((w) => out.push(w));
  const frags = fragments(src, o.punct);
  if (o.mode === "every") frags.forEach(push);
  else {
    let cur = "";
    for (const f of frags) {
      const next = cur ? `${cur} ${f}` : f;
      if (next.length <= o.maxChars) cur = next;
      else {
        if (cur) push(cur);
        cur = f;
      }
    }
    if (cur) push(cur);
  }
  return out.map((l) => finishLine(l, o)).filter(Boolean);
}

/** Lyrics → sections of slides. Repeated sections reuse the same slides array. */
export function buildSlides(text: string, o: SplitOptions): BuiltSection[] {
  const res: BuiltSection[] = [];
  for (const sec of toSections(text)) {
    const lines = sec.lines.flatMap((l) => lineBreak(l, o));
    const slides: string[][] = [];
    for (let i = 0; i < lines.length; i += o.maxLines) slides.push(lines.slice(i, i + o.maxLines));
    const reps = o.expand ? sec.times : 1;
    for (let rep = 0; rep < reps; rep++) res.push({ label: sec.label, slides, rep });
  }
  return res;
}

export const slideCount = (res: BuiltSection[]): number => res.reduce((n, s) => n + s.slides.length, 0);

/** The text ProPresenter imports: one blank line between slides. */
export function toText(res: BuiltSection[], o: SplitOptions): string {
  return res
    .map((sec) => {
      const body = sec.slides.map((s) => s.join("\n")).join("\n\n");
      return o.labels && sec.label ? `${sec.label}\n${body}` : body;
    })
    .join("\n\n");
}

/** File contents for Notepad++ on the church PC: Windows line endings and a final newline. */
export const toFileText = (text: string): string => `${text.replace(/\r?\n/g, "\r\n")}\r\n`;
