import { describe, expect, it } from "vitest";
import { datePart, fileName, nextSunday } from "./filename.ts";

describe("nextSunday", () => {
  it("rolls forward to Sunday and keeps a Sunday as is", () => {
    expect(nextSunday(new Date(2026, 9, 12))).toBe("2026-10-18"); // Monday
    expect(nextSunday(new Date(2026, 9, 18))).toBe("2026-10-18"); // Sunday
  });
});

describe("datePart", () => {
  it("formats each style", () => {
    expect(datePart("2026-10-18", "dmy")).toBe("sun-18-oct-26");
    expect(datePart("2026-10-18", "my")).toBe("sun-oct-26");
    expect(datePart("2026-10-18", "iso")).toBe("2026-10-18");
    expect(datePart("2026-10-18", "none")).toBe("");
  });
});

describe("fileName", () => {
  it("joins title and date and strips characters Windows forbids", () => {
    expect(fileName("First Praise", 0, "2026-10-18", "dmy")).toBe("First Praise - sun-18-oct-26.txt");
    expect(fileName('What: "Is" This?', 0, "", "dmy")).toBe("What Is This.txt");
    expect(fileName("", 2, "2026-10-18", "none")).toBe("Song 3.txt");
  });
});
