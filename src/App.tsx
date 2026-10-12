import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildSlides, extractTitle, fileName, locateSlides, partsFromText, slideCount, toFileText, toText, type Part, type Song } from "./core/index.ts";
import { BrandBar } from "./components/BrandBar.tsx";
import { JumpBar, PageHeader } from "./components/PageHeader.tsx";
import { RunningOrder, type ImportChoice, type PendingImport } from "./components/RunningOrder.tsx";
import { SongEditor, type Highlight } from "./components/SongEditor.tsx";
import { SlidesPanel } from "./components/SlidesPanel.tsx";
import { useToast } from "./components/Toast.tsx";
import { useAppState } from "./hooks/useAppState.ts";
import { NARROW, smooth, useMediaQuery } from "./hooks/useMediaQuery.ts";
import { copyText } from "./services/clipboard.ts";
import { getSaver, type Saver } from "./services/download.ts";
import { ACCEPT, importFile } from "./services/files.ts";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function App() {
  const [state, dispatch] = useAppState();
  const toast = useToast();
  const narrow = useMediaQuery(NARROW);
  const song = state.songs[state.current];

  /* ---- derived slides ---- */
  const sections = useMemo(() => buildSlides(song.text, state.opts), [song.text, state.opts]);
  const ranges = useMemo(() => locateSlides(song.text, sections), [song.text, sections]);
  const text = useMemo(() => toText(sections, state.opts), [sections, state.opts]);
  const counts = useMemo(() => state.songs.map((s) => slideCount(buildSlides(s.text, state.opts))), [state.songs, state.opts]);
  const names = state.songs.map((s, i) => fileName(s.title, i, state.date, state.dateFmt));
  const total = slideCount(sections);

  /* ---- live slide and lyric highlight ---- */
  const [live, setLiveIndex] = useState(-1);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  useEffect(() => {
    setLiveIndex(-1);
    setHighlight(null);
  }, [song.id]);
  const setLive = useCallback(
    (i: number) => {
      if (!total) return;
      const idx = Math.max(0, Math.min(total - 1, i));
      setLiveIndex(idx);
      setHighlight((h) => ({ range: ranges[idx] ?? null, tick: (h?.tick ?? 0) + 1 }));
    },
    [total, ranges],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (["TEXTAREA", "INPUT", "SELECT"].includes(tag)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setLive(live + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLive(live - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [live, setLive]);

  /* ---- slides panel matches the left column on wide screens ---- */
  const leftCol = useRef<HTMLDivElement>(null);
  const [leftHeight, setLeftHeight] = useState(0);
  useEffect(() => {
    const el = leftCol.current;
    if (!el || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => setLeftHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: smooth() });

  /* ---- songs ---- */
  const select = (i: number) => {
    dispatch({ type: "select", index: i });
    if (narrow) jumpTo("sec-song");
  };
  const remove = (i: number) => {
    const before = { songs: state.songs, current: state.current };
    const gone = state.songs[i];
    dispatch({ type: "remove", index: i });
    toast(`Removed "${gone.title || "Untitled song"}".`, { label: "Undo", run: () => dispatch({ type: "restore", ...before }) });
  };
  const add = () => {
    dispatch({ type: "add" });
    if (narrow) jumpTo("sec-song");
    setTimeout(() => document.getElementById("songTitle")?.focus({ preventScroll: !narrow }), 0);
  };
  const editText = (t: string) => {
    setHighlight(null);
    dispatch({ type: "edit", patch: { text: t } });
  };

  /* ---- import ---- */
  const [pending, setPending] = useState<(PendingImport & { revert?: Song }) | null>(null);
  const review = (parts: Part[], source: string, revert?: Song) => {
    if (!parts.length) return toast(`No lyrics found in ${source}.`);
    setPending({ parts, source, revert, counts: parts.map((p) => slideCount(buildSlides(p.text, state.opts))) });
  };
  const accept = (replace: boolean) => {
    if (!pending) return;
    const before = { songs: state.songs, current: state.current };
    dispatch({ type: "import", parts: pending.parts, replace, revert: pending.revert });
    setPending(null);
    const n = plural(pending.parts.length, "song");
    if (replace) toast(`Running order replaced with ${n}.`, { label: "Undo", run: () => dispatch({ type: "restore", ...before }) });
    else toast(`Added ${n} to the running order.`);
  };
  const onPasted = (before: Song, after: string) => {
    const parts = partsFromText(after, "Pasted song");
    if (parts.length >= 2) return review(parts, "the pasted text", before);
    if (before.title.trim()) return;
    const found = extractTitle(after);
    if (!found) return;
    dispatch({ type: "edit", patch: { title: found.title, text: found.rest } });
    toast(`Moved "${found.title}" into the title.`);
  };

  const fileInput = useRef<HTMLInputElement>(null);
  const readFile = async (file: File) => {
    const r = await importFile(file);
    if (r.ok) review(r.parts, r.source);
    else toast(r.message);
  };
  const chooseImport = (c: ImportChoice) => {
    if (c === "paste") {
      if (song.text.trim() || song.title.trim()) dispatch({ type: "add" });
      if (narrow) jumpTo("sec-song");
      setTimeout(() => document.getElementById("lyrics")?.focus({ preventScroll: !narrow }), 0);
      toast("Paste the lyrics into the box. Several songs with CAPITAL headings will be split for you.");
      return;
    }
    if (!fileInput.current) return;
    fileInput.current.accept = ACCEPT[c];
    fileInput.current.click();
  };

  // drag a file anywhere onto the page
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const leave = (e: DragEvent) => {
      if (hasFiles(e) && --depth <= 0) {
        depth = 0;
        setDragging(false);
      }
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const f = e.dataTransfer?.files[0];
      if (f) void readFileRef.current(f);
    };
    document.addEventListener("dragenter", enter);
    document.addEventListener("dragover", over);
    document.addEventListener("dragleave", leave);
    document.addEventListener("drop", drop);
    return () => {
      document.removeEventListener("dragenter", enter);
      document.removeEventListener("dragover", over);
      document.removeEventListener("dragleave", leave);
      document.removeEventListener("drop", drop);
    };
  }, []);
  const readFileRef = useRef(readFile);
  readFileRef.current = readFile;

  /* ---- copy and download ---- */
  const [saver, setSaver] = useState<Saver | null>(null);
  useEffect(() => {
    void getSaver().then((s) => setSaver(() => s));
  }, []);

  const copy = async () => {
    if (await copyText(text)) return toast("Copied. Paste it into ProPresenter.");
    dispatch({ type: "view", view: "text" });
    setTimeout(() => {
      const out = document.getElementById("output") as HTMLTextAreaElement | null;
      out?.focus();
      out?.select();
    }, 0);
    toast("Text selected. Press Ctrl+C (or ⌘C) to copy.");
  };
  const downloadOne = async () => {
    if (!saver) return;
    const r = await saver(names[state.current], toFileText(text));
    if (r === "saved") toast(`Saved ${names[state.current]}`);
    else if (r === "declined") toast("Download cancelled.");
    else if (r === "busy") toast("A save prompt is already open. Finish that one first.");
    else toast("Downloading isn't working here. Use Copy instead.");
  };
  const ready = state.songs.map((s, i) => ({ s, i })).filter(({ s }) => toText(buildSlides(s.text, state.opts), state.opts).trim());
  const downloadAll = async () => {
    if (!saver) return;
    let saved = 0;
    let skipped = 0;
    for (const { s, i } of ready) {
      const r = await saver(names[i], toFileText(toText(buildSlides(s.text, state.opts), state.opts)));
      if (r === "saved") saved++;
      else if (r === "declined") skipped++;
      else {
        toast(r === "busy" ? "A save prompt is already open. Finish that one first." : "Downloading isn't working here. Use Copy instead.");
        return;
      }
    }
    toast(`Saved ${plural(saved, "file")}${skipped ? `, skipped ${skipped}` : ""}.`);
  };

  return (
    <>
      <BrandBar />
      <div className="wrap">
        <PageHeader
          date={state.date}
          dateFmt={state.dateFmt}
          onDate={(date) => dispatch({ type: "date", date })}
          onDateFmt={(fmt) => dispatch({ type: "dateFmt", fmt })}
        />
        <JumpBar onJump={jumpTo} />
        <div className="grid">
          <div className="col" ref={leftCol}>
            <RunningOrder
              songs={state.songs}
              current={state.current}
              counts={counts}
              pending={pending}
              downloadNames={saver ? ready.map(({ i }) => names[i]) : null}
              onSelect={select}
              onRemove={remove}
              onAdd={add}
              onImport={chooseImport}
              onAccept={accept}
              onCancelImport={() => setPending(null)}
              onDownloadAll={downloadAll}
            />
            <SongEditor
              song={song}
              index={state.current}
              count={state.songs.length}
              highlight={highlight}
              scrollPage={!narrow}
              onTitle={(title) => dispatch({ type: "edit", patch: { title } })}
              onText={editText}
              onPasted={onPasted}
              onMove={(by) => dispatch({ type: "move", by })}
            />
          </div>
          <SlidesPanel
            sections={sections}
            opts={state.opts}
            text={text}
            live={live}
            view={state.view}
            fileName={names[state.current]}
            canDownload={!!saver}
            height={narrow ? undefined : Math.max(480, leftHeight)}
            onLive={(i) => setLive(i)}
            onView={(view) => dispatch({ type: "view", view })}
            onOpts={(patch) => dispatch({ type: "opts", patch })}
            onCopy={copy}
            onDownload={downloadOne}
          />
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void readFile(f);
          e.target.value = "";
        }}
      />
      {dragging && <div className="dropzone">Drop the Word file to import it</div>}
    </>
  );
}
