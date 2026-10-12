import { describe, expect, it } from "vitest";
import { buildSlides, lineBreak, slideCount, toFileText, toSections, toText, wrapBalanced } from "./split.ts";
import { DEFAULT_OPTIONS as O } from "./types.ts";
import { SAMPLE_SONGS } from "./sample.ts";

describe("toSections", () => {
  it("reads labels, blank lines and repeat markers", () => {
    const s = toSections("Verse 1\nA, b\n\nChorus (x2)\nC\n\nD\n(x3)");
    expect(s.map((x) => [x.label, x.lines.length, x.times])).toEqual([
      ["Verse 1", 1, 1],
      ["Chorus", 1, 2],
      ["", 1, 3],
    ]);
  });

  it("takes an inline label off the lyric line", () => {
    expect(toSections("Chorus: Holy, holy")[0]).toMatchObject({ label: "Chorus", lines: ["Holy, holy"] });
    expect(toSections("[Verse Two]\nSing")[0]).toMatchObject({ label: "Verse Two", lines: ["Sing"] });
  });

  it("joins a lowercase word Word wrapped onto its own line", () => {
    expect(toSections("Fill our hearts with your\nlove\nYour love surrounds us")[0].lines).toEqual([
      "Fill our hearts with your love",
      "Your love surrounds us",
    ]);
  });

  it("treats Word's thin and no-break spaces as spaces", () => {
    expect(toSections("working in this place\n In abundance")[0].lines).toEqual(["working in this place", "In abundance"]);
  });
});

describe("lineBreak", () => {
  it("joins short comma phrases up to the limit and drops end commas", () => {
    expect(lineBreak("Holy, holy, holy! Lord God Almighty!", O)).toEqual(["Holy, holy, holy!", "Lord God Almighty!"]);
  });

  it("breaks at every comma in 'every' mode", () => {
    expect(lineBreak("one, two, three", { ...O, mode: "every" })).toEqual(["One", "Two", "Three"]);
  });

  it("wraps a long phrase with no commas into balanced lines", () => {
    const lines = wrapBalanced("Early in the morning our song shall rise to Thee", 32);
    expect(lines).toHaveLength(2);
    expect(lines.join(" ")).toBe("Early in the morning our song shall rise to Thee");
  });
});

describe("buildSlides / toText", () => {
  it("groups lines two to a slide and separates slides with a blank line", () => {
    const res = buildSlides("A, b, c, d, e", { ...O, mode: "every" });
    expect(res[0].slides).toEqual([["A", "B"], ["C", "D"], ["E"]]);
    expect(toText(res, O)).toBe("A\nB\n\nC\nD\n\nE");
  });

  it("expands (x2) sections only when asked, sharing the slides array", () => {
    const text = "Chorus (x2)\nSing";
    expect(slideCount(buildSlides(text, O))).toBe(1);
    const res = buildSlides(text, { ...O, expand: true });
    expect(res).toHaveLength(2);
    expect(res[0].slides).toBe(res[1].slides);
  });

  it("writes section names only when asked", () => {
    expect(toText(buildSlides("Verse 1\nSing", { ...O, labels: true }), { ...O, labels: true })).toBe("Verse 1\nSing");
  });

  it("never changes a word of the sample hymns", () => {
    for (const song of SAMPLE_SONGS) {
      const words = (s: string) => (s.match(/[\p{L}\p{N}']+/gu) ?? []).map((w) => w.toLowerCase());
      const source = words(song.text.replace(/^Verse \d+( \(x2\))?$/gm, ""));
      expect(words(toText(buildSlides(song.text, O), O))).toEqual(source);
    }
  });
});

describe("toFileText", () => {
  it("uses Windows line endings and ends with a newline", () => {
    expect(toFileText("A\nB\n\nC")).toBe("A\r\nB\r\n\r\nC\r\n");
  });
});
