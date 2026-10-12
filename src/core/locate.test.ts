import { describe, expect, it } from "vitest";
import { locateSlides } from "./locate.ts";
import { buildSlides } from "./split.ts";
import { DEFAULT_OPTIONS as O } from "./types.ts";
import { SAMPLE_SONGS } from "./sample.ts";

describe("locateSlides", () => {
  it("maps every slide of the sample hymns back to its source", () => {
    for (const song of SAMPLE_SONGS) {
      for (const opts of [O, { ...O, mode: "every" as const }, { ...O, maxLines: 1, cap: false, stripEnd: false }]) {
        const res = buildSlides(song.text, opts);
        const ranges = locateSlides(song.text, res);
        expect(ranges.every(Boolean)).toBe(true);
      }
    }
  });

  it("returns the exact source span, ignoring the capitalisation it added", () => {
    const text = "Verse 1\nholy, holy, holy! lord God Almighty!";
    const res = buildSlides(text, { ...O, maxLines: 1 });
    const [first, second] = locateSlides(text, res);
    expect(text.slice(first![0], first![1])).toBe("holy, holy, holy");
    expect(text.slice(second![0], second![1])).toBe("lord God Almighty");
  });

  it("points a repeated section at its first appearance", () => {
    const text = "Chorus (x2)\nSing it, again";
    const res = buildSlides(text, { ...O, expand: true });
    const ranges = locateSlides(text, res);
    expect(ranges).toHaveLength(2);
    expect(ranges[1]).toEqual(ranges[0]);
  });
});
