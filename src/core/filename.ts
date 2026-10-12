import type { DateFormat } from "./types.ts";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** The coming Sunday (today, if today is Sunday) as YYYY-MM-DD. `today` is injectable so tests don't rot. */
export function nextSunday(today: Date = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `2026-10-18` → `sun-18-oct-26` (dmy), `sun-oct-26` (my), `2026-10-18` (iso) or "" (none). */
export function datePart(date: string, fmt: DateFormat): string {
  if (!date || fmt === "none") return "";
  if (fmt === "iso") return date;
  const [y, m, d] = date.split("-").map(Number);
  const day = DAYS[new Date(y, m - 1, d).getDay()];
  const yy = String(y).slice(-2);
  return fmt === "my" ? `${day}-${MONTHS[m - 1]}-${yy}` : `${day}-${d}-${MONTHS[m - 1]}-${yy}`;
}

/** `First Praise - sun-18-oct-26.txt`. Characters Windows forbids in file names are removed. */
export function fileName(title: string, index: number, date: string, fmt: DateFormat): string {
  const fallback = `Song ${index + 1}`;
  const base =
    (title || fallback)
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/, "") || fallback;
  const dp = datePart(date, fmt);
  return `${base}${dp ? ` - ${dp}` : ""}.txt`;
}
