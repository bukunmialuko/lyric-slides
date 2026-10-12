import { useEffect, useRef, type CSSProperties } from "react";
import type { BuiltSection, SplitOptions } from "../core/index.ts";
import type { View } from "../services/storage.ts";
import { Icon } from "./Icon.tsx";
import { InfoTip } from "./InfoTip.tsx";
import { SlideSettings } from "./SlideSettings.tsx";

interface Props {
  sections: BuiltSection[];
  opts: SplitOptions;
  text: string;
  live: number;
  view: View;
  fileName: string;
  canDownload: boolean;
  /** Fixed height on wide screens so the panel matches the left column; undefined lets it grow. */
  height?: number;
  onLive: (index: number, fromClick: boolean) => void;
  onView: (view: View) => void;
  onOpts: (patch: Partial<SplitOptions>) => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function SlidesPanel(p: Props) {
  const total = p.sections.reduce((n, s) => n + s.slides.length, 0);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);

  // keep the live slide visible when stepping with Back/Next or the arrow keys
  useEffect(() => {
    tiles.current[p.live]?.scrollIntoView({ block: "nearest" });
  }, [p.live]);

  // One flat list of section headings and slide tiles, numbered in show order.
  const items: ({ kind: "sec"; key: string; label: string } | { kind: "slide"; key: string; idx: number; lines: string[] })[] = [];
  let n = 0;
  p.sections.forEach((sec, si) => {
    items.push({ kind: "sec", key: `s${si}`, label: `${sec.label || `Section ${si + 1}`}${sec.rep ? ` (repeat ${sec.rep + 1})` : ""}` });
    for (const lines of sec.slides) {
      items.push({ kind: "slide", key: `t${n}`, idx: n, lines });
      n++;
    }
  });

  const style: CSSProperties | undefined = p.height ? { height: p.height } : undefined;
  return (
    <section className="panel" id="slidesPanel" aria-labelledby="sl-h" style={style}>
      <div className="phead">
        <h2 id="sl-h">Slides</h2>
        <InfoTip label="About slides">
          <p>
            Click a slide to highlight its words in the lyrics. Step through with Back and Next, or <kbd>←</kbd> <kbd>→</kbd>.
          </p>
          <p>Amber text means a line ran past the character limit with no good break point.</p>
        </InfoTip>
        {total > 0 && <span className="stats">{`${total} slide${total === 1 ? "" : "s"}`}</span>}
        <span className="grow" />
        <div className="seg" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={p.view === "slides"} onClick={() => p.onView("slides")}>
            Slides
          </button>
          <button type="button" role="tab" aria-selected={p.view === "text"} onClick={() => p.onView("text")}>
            Text
          </button>
        </div>
        <SlideSettings opts={p.opts} onChange={p.onOpts} />
      </div>

      {p.view === "slides" ? (
        <div className="view">
          <div className="slides" role="list">
            {items.map((it) =>
              it.kind === "sec" ? (
                <div key={it.key} className="sec">
                  {it.label}
                </div>
              ) : (
                <div
                  key={it.key}
                  ref={(el) => {
                    tiles.current[it.idx] = el;
                  }}
                  className={`slide${it.lines.some((l) => l.length > p.opts.maxChars) ? " long" : ""}${it.idx === p.live ? " live" : ""}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => p.onLive(it.idx, true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") p.onLive(it.idx, true);
                  }}
                >
                  <span className="tag">{it.idx + 1}</span>
                  <div className="txt">
                    {it.lines.map((l, k) => (
                      <div key={k}>{l}</div>
                    ))}
                  </div>
                </div>
              ),
            )}
            {!total && <p className="empty-note">Paste this song's lyrics, or use Import, and its slides appear here.</p>}
          </div>
        </div>
      ) : (
        <div className="view">
          <textarea id="output" readOnly spellCheck={false} aria-label="Text file contents" value={p.text} />
        </div>
      )}

      <div className="pfoot">
        <button type="button" disabled={p.live <= 0} onClick={() => p.onLive(p.live - 1, false)}>
          ‹ Back
        </button>
        <button type="button" disabled={!total || p.live >= total - 1} onClick={() => p.onLive(p.live + 1, false)}>
          Next ›
        </button>
        <div className="file">
          <span className="fname" title={p.fileName}>
            {p.fileName}
          </span>
          <InfoTip label="About the text file" place="right up">
            <p>Plain UTF-8 text with Windows line endings, so it opens cleanly in Notepad++.</p>
            <p>Each blank line starts a new slide. In ProPresenter use File › Import, or paste the text into the Reflow editor.</p>
          </InfoTip>
        </div>
        <button className="icon" type="button" aria-label="Copy text" title="Copy text" onClick={p.onCopy}>
          <Icon name="copy" />
        </button>
        {p.canDownload && (
          <button className="primary" type="button" disabled={!total} onClick={p.onDownload}>
            <Icon name="download" />
            Download
          </button>
        )}
      </div>
    </section>
  );
}
