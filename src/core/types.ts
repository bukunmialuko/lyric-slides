/** A song in the running order. `text` is the lyrics exactly as the choir sent them. */
export interface Song {
  id: number;
  title: string;
  text: string;
}

/** How lyrics are broken into slide lines. Shared by every song. */
export interface SplitOptions {
  /** Lines per slide (ProPresenter shows the lines of one slide together). */
  maxLines: number;
  /** Soft limit for one projected line, in characters. */
  maxChars: number;
  /** "pack" joins short comma phrases up to maxChars; "every" breaks at each one. */
  mode: "pack" | "every";
  /** Punctuation that may end a line. Always includes the comma. */
  punct: string;
  /** Drop , ; : left at the end of a projected line. */
  stripEnd: boolean;
  /** Capitalise the first letter of each projected line. */
  cap: boolean;
  /** Repeat sections marked (x2) instead of dropping the marker. */
  expand: boolean;
  /** Write section names (Verse 1, Chorus) into the text file. */
  labels: boolean;
}

export const DEFAULT_OPTIONS: SplitOptions = {
  maxLines: 2,
  maxChars: 32,
  mode: "pack",
  punct: ",;:!?.",
  stripEnd: true,
  cap: true,
  expand: false,
  labels: false,
};

/** A block of source lines between blank lines, with its label and repeat count. */
export interface Section {
  label: string;
  lines: string[];
  times: number;
}

/** A section after splitting. Repeats share the same `slides` array object. */
export interface BuiltSection {
  label: string;
  slides: string[][];
  rep: number;
}

/** [start, end) character offsets into a song's original text, or null if not found. */
export type Range = readonly [number, number] | null;

/** One song found while importing a document or a big paste. */
export interface Part {
  title: string;
  text: string;
}

/** A paragraph read from a Word document, with the cues used to spot headings. */
export interface Para {
  text: string;
  /** Largest font size in the paragraph, in half-points (Word's unit). 0 when empty. */
  size: number;
  /** Uses a Word Heading / Title / Subtitle style. */
  styleHeading: boolean;
}

export type DateFormat = "dmy" | "my" | "iso" | "none";
