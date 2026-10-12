import { strFromU8, unzipSync } from "fflate";
import type { Para } from "./types.ts";

// Reads a .docx without a DOM: unzip with fflate, then scan the WordprocessingML
// with regular expressions. Only paragraphs, runs, text, tabs, breaks, styles and
// font sizes are read — that is all heading detection needs.

const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
const decode = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e] ?? m;
  });

const val = (xml: string, tag: string): string | null => {
  const m = xml.match(new RegExp(`<w:${tag}\\b[^>]*\\bw:val="([^"]*)"`));
  return m ? m[1] : null;
};

interface Style {
  name: string;
  based: string | null;
  size: number | null;
}

function readStyles(xml: string): { styles: Map<string, Style>; defaultSize: number } {
  const styles = new Map<string, Style>();
  const defRun = xml.match(/<w:rPrDefault>([\s\S]*?)<\/w:rPrDefault>/);
  const defaultSize = Number((defRun && val(defRun[1], "sz")) || 22);
  for (const m of xml.matchAll(/<w:style\b([^>]*)>([\s\S]*?)<\/w:style>/g)) {
    const id = m[1].match(/w:styleId="([^"]*)"/)?.[1];
    if (!id) continue;
    const body = m[2].replace(/<w:pPr>[\s\S]*?<\/w:pPr>/g, "");
    const rPr = body.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? "";
    const size = val(rPr, "sz");
    styles.set(id, { name: val(body, "name") ?? id, based: val(body, "basedOn"), size: size ? Number(size) : null });
  }
  return { styles, defaultSize };
}

/** Read the paragraphs of a .docx, each with its text, largest font size and heading style. */
export function readDocx(bytes: Uint8Array): Para[] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => f.name === "word/document.xml" || f.name === "word/styles.xml" });
  } catch {
    throw new Error("not-docx");
  }
  const doc = files["word/document.xml"];
  if (!doc) throw new Error("not-docx");
  const { styles, defaultSize } = files["word/styles.xml"] ? readStyles(strFromU8(files["word/styles.xml"])) : { styles: new Map<string, Style>(), defaultSize: 22 };
  const sizeOf = (id: string | null): number | null => {
    for (let g = 0; id && g < 20; g++) {
      const s = styles.get(id);
      if (!s) return null;
      if (s.size != null) return s.size;
      id = s.based;
    }
    return null;
  };

  let xml = strFromU8(doc);
  xml = xml.replace(/<mc:Fallback>[\s\S]*?<\/mc:Fallback>/g, ""); // text boxes appear twice otherwise
  const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? "";

  const paras: Para[] = [];
  for (const p of body.matchAll(/<w:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:p>)/g)) {
    const inner = p[1] ?? "";
    const pPr = inner.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/)?.[1] ?? "";
    const pStyle = val(pPr, "pStyle") ?? "Normal";
    let text = "";
    let size = 0;
    for (const r of inner.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
      let t = "";
      for (const piece of r[1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/>|<w:(?:br|cr)\b[^>]*\/>/g)) {
        if (piece[1] !== undefined) t += decode(piece[1]);
        else if (piece[0].startsWith("<w:tab")) t += " ";
        else t += "\n";
      }
      if (!t) continue;
      text += t;
      if (!t.trim()) continue;
      const rPr = r[1].match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] ?? "";
      const direct = val(rPr, "sz");
      const runSize = direct ? Number(direct) : (sizeOf(val(rPr, "rStyle")) ?? sizeOf(pStyle) ?? defaultSize);
      size = Math.max(size, runSize);
    }
    const name = styles.get(pStyle)?.name ?? pStyle;
    paras.push({ text, size, styleHeading: /^(heading|title|subtitle)\b/i.test(name) || /^heading/i.test(pStyle) });
  }
  return paras;
}
