import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { readDocx } from "./docx.ts";
import { partsFromParas } from "./parts.ts";

// A minimal .docx shaped like the ones the choir sends: custom styles where the
// set names are 21pt and the lyrics 13pt, no Word "Heading" styles at all.
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const para = (style: string, text: string) =>
  `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${text ? `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>` : ""}</w:p>`;
const styles = `<?xml version="1.0"?><w:styles ${W}>
  <w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="p1"><w:name w:val="p1"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="42"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="p2"><w:name w:val="p2"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="26"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="p3"><w:name w:val="p3"/><w:basedOn w:val="p2"/></w:style>
</w:styles>`;

function docx(body: string): Uint8Array {
  const document = `<?xml version="1.0"?><w:document ${W}><w:body>${body}<w:sectPr/></w:body></w:document>`;
  return zipSync({ "word/document.xml": strToU8(document), "word/styles.xml": strToU8(styles) });
}

describe("readDocx", () => {
  const bytes = docx(
    [
      para("p1", "OPENING SET"),
      para("p2", "Amazing grace! How sweet the sound"),
      para("p2", "That saved a wretch&#x2005;like me &amp; you"),
      "<w:p/>",
      para("p1", "CLOSING SET"),
      `<w:p><w:pPr><w:pStyle w:val="p2"/></w:pPr><w:r><w:t>Line one</w:t><w:br/><w:t>Line two</w:t><w:tab/><w:t>end</w:t></w:r></w:p>`,
    ].join(""),
  );

  it("reads text, entities, breaks, tabs and inherited sizes", () => {
    const paras = readDocx(bytes);
    expect(paras.map((p) => p.text)).toEqual([
      "OPENING SET",
      "Amazing grace! How sweet the sound",
      "That saved a wretch like me & you",
      "",
      "CLOSING SET",
      "Line one\nLine two end",
    ]);
    expect(paras.map((p) => p.size)).toEqual([42, 26, 26, 0, 42, 26]);
  });

  it("splits into one song per heading", () => {
    const parts = partsFromParas(readDocx(bytes), "Doc");
    expect(parts.map((p) => p.title)).toEqual(["Opening Set", "Closing Set"]);
    expect(parts[1].text).toBe("Line one\nLine two end");
  });

  it("rejects files that are not Word documents", () => {
    expect(() => readDocx(strToU8("plain text"))).toThrow("not-docx");
  });
});
