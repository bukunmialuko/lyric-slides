import { useLayoutEffect, useRef, type ClipboardEvent } from "react";
import type { Range, Song } from "../core/index.ts";
import { Icon } from "./Icon.tsx";
import { InfoTip } from "./InfoTip.tsx";

/** A highlight request. `tick` changes on every request so the same range scrolls into view again. */
export interface Highlight {
  range: Range;
  tick: number;
}

interface Props {
  song: Song;
  index: number;
  count: number;
  highlight: Highlight | null;
  /** True when the page should also scroll to bring the lyrics into view (wide layout). */
  scrollPage: boolean;
  onTitle: (title: string) => void;
  onText: (text: string) => void;
  /** Called after a paste lands, with the song as it was before the paste. */
  onPasted: (before: Song, after: string) => void;
  onMove: (by: -1 | 1) => void;
}

export function SongEditor({ song, index, count, highlight, scrollPage, onTitle, onText, onPasted, onMove }: Props) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLElement>(null);
  const range = highlight?.range ?? null;

  // Scroll the textarea (and, on wide screens, the page) to the highlighted words.
  useLayoutEffect(() => {
    if (!highlight?.range || !ta.current || !back.current || !mark.current) return;
    const t = ta.current;
    t.scrollTop = Math.max(0, mark.current.offsetTop - t.clientHeight / 3);
    back.current.scrollTop = t.scrollTop;
    if (scrollPage) {
      const r = t.getBoundingClientRect();
      if (r.bottom < 80 || r.top > innerHeight - 80) t.scrollIntoView({ block: "nearest" });
    }
  }, [highlight, scrollPage]);

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const before = { ...song };
    const el = e.currentTarget;
    setTimeout(() => onPasted(before, el.value), 0);
  };

  const text = song.text;
  return (
    <section className="panel" id="sec-song" aria-labelledby="ed-h">
      <div className="phead">
        <h2 id="ed-h">Song</h2>
        <span className="stats">
          {index + 1} of {count}
        </span>
        <span className="grow" />
        <button className="icon ghost" type="button" aria-label="Move song up" title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
          <Icon name="up" />
        </button>
        <button className="icon ghost" type="button" aria-label="Move song down" title="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
          <Icon name="down" />
        </button>
      </div>
      <label className="opt">
        <span>Title</span>
        <input id="songTitle" type="text" placeholder="e.g. First Praise" autoComplete="off" value={song.title} onChange={(e) => onTitle(e.target.value)} />
      </label>
      <div className="opt">
        <span>
          <label htmlFor="lyrics">Lyrics from the choir</label>
          <InfoTip label="About pasting lyrics">
            <p>Paste the lyrics exactly as sent. A title on the first line moves into the Title box if the song has none.</p>
            <p>
              Lines like <kbd>Verse 1</kbd> or <kbd>Chorus:</kbd> become section names. <kbd>(x2)</kbd> markers are removed, or repeated if you turn that on in
              slide settings.
            </p>
            <p>Paste several songs with CAPITAL headings and you'll be offered to split them.</p>
          </InfoTip>
        </span>
        <div className="ta-wrap">
          <div className="ta-back" ref={back} aria-hidden="true">
            {range ? (
              <>
                {text.slice(0, range[0])}
                <mark ref={mark}>{text.slice(range[0], range[1])}</mark>
                {text.slice(range[1])}
                {"\n"}
              </>
            ) : (
              text + "\n"
            )}
          </div>
          <textarea
            id="lyrics"
            ref={ta}
            spellCheck={false}
            placeholder="Paste the choir's lyrics here"
            value={text}
            onChange={(e) => onText(e.target.value)}
            onPaste={onPaste}
            onScroll={(e) => {
              if (back.current) back.current.scrollTop = e.currentTarget.scrollTop;
            }}
          />
        </div>
      </div>
    </section>
  );
}
