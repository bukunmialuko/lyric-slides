import type { DateFormat } from "../core/index.ts";

interface Props {
  date: string;
  dateFmt: DateFormat;
  onDate: (date: string) => void;
  onDateFmt: (fmt: DateFormat) => void;
}

export function PageHeader({ date, dateFmt, onDate, onDateFmt }: Props) {
  return (
    <header className="pagehead">
      <h1>Lyric Slides</h1>
      <div className="service">
        <label className="opt">
          <span>Service date</span>
          <input id="svcDate" type="date" value={date} onChange={(e) => onDate(e.target.value)} />
        </label>
        <label className="opt">
          <span>Date in file name</span>
          <select id="dateFmt" value={dateFmt} onChange={(e) => onDateFmt(e.target.value as DateFormat)}>
            <option value="dmy">sun-18-oct-26</option>
            <option value="my">sun-oct-26</option>
            <option value="iso">2026-10-18</option>
            <option value="none">No date</option>
          </select>
        </label>
      </div>
    </header>
  );
}

export function JumpBar({ onJump }: { onJump: (id: string) => void }) {
  return (
    <nav className="jump" aria-label="Jump to section">
      <button type="button" onClick={() => onJump("sec-order")}>
        Songs
      </button>
      <button type="button" onClick={() => onJump("sec-song")}>
        Lyrics
      </button>
      <button type="button" onClick={() => onJump("slidesPanel")}>
        Slides
      </button>
    </nav>
  );
}
