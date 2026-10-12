import { DEFAULT_OPTIONS, type DateFormat, type Song, type SplitOptions } from "../core/index.ts";

export type View = "slides" | "text";

export interface AppState {
  songs: Song[];
  current: number;
  date: string;
  dateFmt: DateFormat;
  opts: SplitOptions;
  view: View;
}

// Shared with the claude.ai artifact build, so both read the same saved songs.
// Changing the stored shape needs a migration in `load()`, not a new key.
const KEY = "lyric-splitter-v2";
const FORMATS: DateFormat[] = ["dmy", "my", "iso", "none"];

/** Older saves kept options as raw form values ("2", "32"); coerce them back. */
function readOpts(raw: unknown): SplitOptions {
  const o = { ...DEFAULT_OPTIONS };
  if (!raw || typeof raw !== "object") return o;
  const r = raw as Record<string, unknown>;
  if (r.maxLines != null) o.maxLines = Math.min(3, Math.max(1, Number(r.maxLines) || o.maxLines));
  if (r.maxChars != null) o.maxChars = Math.min(80, Math.max(12, Number(r.maxChars) || o.maxChars));
  if (r.mode === "pack" || r.mode === "every") o.mode = r.mode;
  if (typeof r.punct === "string" && r.punct.includes(",")) o.punct = r.punct;
  for (const k of ["stripEnd", "cap", "expand", "labels"] as const) if (typeof r[k] === "boolean") o[k] = r[k];
  return o;
}

export function load(): Partial<AppState> | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!s || !Array.isArray(s.songs) || !s.songs.length) return null;
    const songs: Song[] = s.songs.map((x: Partial<Song>, i: number) => ({ id: Number(x.id) || i + 1, title: String(x.title ?? ""), text: String(x.text ?? "") }));
    return {
      songs,
      current: Math.min(Math.max(0, Number(s.current) || 0), songs.length - 1),
      date: typeof s.date === "string" ? s.date : "",
      dateFmt: FORMATS.includes(s.dateFmt) ? s.dateFmt : "dmy",
      opts: readOpts(s.opts),
      view: s.view === "text" ? "text" : "slides",
    };
  } catch {
    return null;
  }
}

/** Browser storage can be missing or full (private windows, previews); saving is best-effort. */
export function save(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* nothing to do */
  }
}
