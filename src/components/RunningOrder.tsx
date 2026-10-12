import { useEffect, useRef, useState } from "react";
import type { Part, Song } from "../core/index.ts";
import { Icon } from "./Icon.tsx";
import { InfoTip } from "./InfoTip.tsx";
import { Popover } from "./Popover.tsx";

export type ImportChoice = "docx" | "txt" | "paste";

export interface PendingImport {
  parts: Part[];
  source: string;
  /** Slide count per part, for the review list. */
  counts: number[];
}

interface Props {
  songs: Song[];
  current: number;
  counts: number[];
  pending: PendingImport | null;
  /** File names that Download all would save; null hides the button (saving unavailable). */
  downloadNames: string[] | null;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  onImport: (choice: ImportChoice) => void;
  onAccept: (replace: boolean) => void;
  onCancelImport: () => void;
  onDownloadAll: () => void;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function RunningOrder(p: Props) {
  const total = p.counts.reduce((a, b) => a + b, 0);
  return (
    <section className="panel" id="sec-order" aria-labelledby="ro-h">
      <div className="phead">
        <h2 id="ro-h">Running order</h2>
        <InfoTip label="About the running order">
          <p>Each song becomes its own .txt file. Click a song to edit it, or × to remove it.</p>
          <p>
            Import a Word .docx or a .txt file, or drop one onto the page. Headings in a bigger font or in CAPITALS, like FIRST PRAISE or MIDDLE SET, each
            become a separate song with that title.
          </p>
        </InfoTip>
        <span className="grow" />
        <span className="stats">
          {plural(p.songs.length, "song")} · {plural(total, "slide")}
        </span>
        {p.downloadNames && <DownloadAll names={p.downloadNames} onConfirm={p.onDownloadAll} />}
      </div>

      <ol className="songs">
        {p.songs.map((s, i) => (
          <li className="songrow" key={s.id} aria-current={i === p.current ? "true" : "false"}>
            <button type="button" className="pick" onClick={() => p.onSelect(i)}>
              <span className="n">{i + 1}</span>
              <span className={`t${s.title ? "" : " empty"}`}>{s.title || "Untitled song"}</span>
              <span className="c">{p.counts[i] ? plural(p.counts[i], "slide") : "empty"}</span>
            </button>
            <button type="button" className="x" aria-label={`Remove ${s.title || "untitled song"}`} title="Remove song" onClick={() => p.onRemove(i)}>
              <Icon name="x" />
            </button>
          </li>
        ))}
      </ol>

      {p.pending && <ImportReview pending={p.pending} onAccept={p.onAccept} onCancel={p.onCancelImport} />}

      <div className="row">
        <button type="button" onClick={p.onAdd}>
          <Icon name="plus" />
          Add song
        </button>
        <ImportMenu onChoose={p.onImport} />
      </div>
    </section>
  );
}

function ImportMenu({ onChoose }: { onChoose: (c: ImportChoice) => void }) {
  const items: { kind: ImportChoice; icon: "word" | "txt" | "paste"; title: string; note: string }[] = [
    { kind: "docx", icon: "word", title: "Word document", note: ".docx file from the choir" },
    { kind: "txt", icon: "txt", title: "Text file", note: ".txt saved from Notepad or WhatsApp" },
    { kind: "paste", icon: "paste", title: "Paste text", note: "Copied from a message or email" },
  ];
  return (
    <Popover
      label="Import"
      role="menu"
      align="left"
      trigger={({ open, toggle }) => (
        <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
          <Icon name="upload" />
          Import
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="label">Import from</div>
          {items.map((it) => (
            <button
              key={it.kind}
              className="menuitem"
              role="menuitem"
              type="button"
              onClick={() => {
                close();
                onChoose(it.kind);
              }}
            >
              <Icon name={it.icon} />
              <span>
                {it.title}
                <small>{it.note}</small>
              </span>
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}

function DownloadAll({ names, onConfirm }: { names: string[]; onConfirm: () => void }) {
  return (
    <Popover
      label="Download all songs"
      trigger={({ open, toggle }) => (
        <button className="icon ghost" type="button" aria-label="Download all songs" title="Download all songs" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
          <Icon name="download" />
        </button>
      )}
    >
      {(close) => (
        <div className="confirm">
          <div className="q">{names.length ? `Download ${plural(names.length, "file")}?` : "No songs with lyrics yet"}</div>
          <ul>
            {names.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="acts">
            <button type="button" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="primary"
              disabled={!names.length}
              onClick={() => {
                close();
                onConfirm();
              }}
            >
              <Icon name="download" />
              Download all
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

/** Shows what an import found and asks whether to add it or replace the running order. */
function ImportReview({ pending, onAccept, onCancel }: { pending: PendingImport; onAccept: (replace: boolean) => void; onCancel: () => void }) {
  const [armed, setArmed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollIntoView({ block: "nearest" });
    setArmed(false);
  }, [pending]);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <div className="importbox" ref={box}>
      <div className="ib-head">
        Found {plural(pending.parts.length, "song")} in {pending.source}
      </div>
      <ol className="ib-list">
        {pending.parts.map((part, i) => (
          <li key={i}>
            {part.title} <span className="meta">· {plural(pending.counts[i], "slide")}</span>
          </li>
        ))}
      </ol>
      <div className="row">
        <button className="primary" type="button" onClick={() => onAccept(false)}>
          Add to running order
        </button>
        <button type="button" className={armed ? "primary" : ""} onClick={() => (armed ? onAccept(true) : setArmed(true))}>
          {armed ? "Click again to replace all songs" : "Replace running order"}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
