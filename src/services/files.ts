import { partsFromParas, partsFromText, readDocx, titleCase, type Part } from "../core/index.ts";

export type ImportKind = "docx" | "txt";

export const ACCEPT: Record<ImportKind, string> = {
  docx: ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: ".txt,text/plain",
};

export type ImportResult = { ok: true; parts: Part[]; source: string } | { ok: false; message: string };

/** Read a file the user picked or dropped into songs, using its headings as titles. */
export async function importFile(file: File): Promise<ImportResult> {
  const name = file.name || "file";
  const fallback = titleCase(name.replace(/\.[^.]+$/, "").replace(/_+/g, " ")) || "Imported song";
  try {
    if (/\.docx$/i.test(name)) {
      const parts = partsFromParas(readDocx(new Uint8Array(await file.arrayBuffer())), fallback);
      return { ok: true, parts, source: name };
    }
    if (/\.(txt|text|md)$/i.test(name) || file.type.startsWith("text/")) {
      return { ok: true, parts: partsFromText(await file.text(), fallback), source: name };
    }
    if (/\.doc$/i.test(name)) {
      return { ok: false, message: "That's an older .doc file. In Word, choose File › Save As › Word Document (.docx), then import that." };
    }
    return { ok: false, message: "Import a Word .docx file or a .txt file." };
  } catch {
    return { ok: false, message: "Couldn't read that file. Make sure it's a Word .docx document." };
  }
}
