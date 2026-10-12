import { describe, expect, it } from "vitest";
import { partsFromParas, partsFromText } from "./parts.ts";
import { extractTitle } from "./title.ts";
import type { Para } from "./types.ts";

describe("partsFromText", () => {
  it("splits at CAPITAL headings but not at section names", () => {
    const parts = partsFromText("FIRST PRAISE\nSing\n\nVERSE 1\nMore\nLAST PRAISE\nEnd", "Pasted");
    expect(parts.map((p) => p.title)).toEqual(["First Praise", "Last Praise"]);
    expect(parts[0].text).toBe("Sing\n\nVERSE 1\nMore");
  });

  it("keeps text before the first heading under the fallback title", () => {
    expect(partsFromText("Intro line\nOPENING\nSing", "Pasted").map((p) => p.title)).toEqual(["Pasted", "Opening"]);
  });
});

describe("partsFromParas", () => {
  const p = (text: string, size = 26, styleHeading = false): Para => ({ text, size, styleHeading });

  it("uses a bigger font as the heading cue", () => {
    const parts = partsFromParas([p("Opening Set", 42), p("Sing, sing"), p(""), p("MIDDLE SET", 33), p("More")], "Doc");
    expect(parts.map((x) => x.title)).toEqual(["Opening Set", "Middle Set"]);
  });

  it("ignores lyrics in capitals when the document has real headings", () => {
    const parts = partsFromParas([p("First", 42), p("BABA OOO"), p("Sing")], "Doc");
    expect(parts).toHaveLength(1);
    expect(parts[0].text).toBe("BABA OOO\nSing");
  });

  it("falls back to CAPITALS when nothing is styled", () => {
    expect(partsFromParas([p("FIRST PRAISE"), p("Sing"), p("LAST PRAISE"), p("End")], "Doc").map((x) => x.title)).toEqual([
      "First Praise",
      "Last Praise",
    ]);
  });
});

describe("extractTitle", () => {
  it("takes a capitals or Title: first line", () => {
    expect(extractTitle("AMAZING GRACE\nVerse 1\nSing")).toEqual({ title: "Amazing Grace", rest: "Verse 1\nSing" });
    expect(extractTitle("Title: Holy Holy\nSing")?.title).toBe("Holy Holy");
  });

  it("leaves lyrics and section names alone", () => {
    expect(extractTitle("Holy, holy, holy\nSing")).toBeNull();
    expect(extractTitle("Verse 1\nSing")).toBeNull();
  });
});
