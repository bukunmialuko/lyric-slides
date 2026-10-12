import { useEffect, useReducer } from "react";
import { DEFAULT_OPTIONS, SAMPLE_SONGS, nextSunday, type DateFormat, type Part, type Song, type SplitOptions } from "../core/index.ts";
import { load, save, type AppState, type View } from "../services/storage.ts";

export type Action =
  | { type: "select"; index: number }
  | { type: "add" }
  | { type: "edit"; patch: Partial<Pick<Song, "title" | "text">> }
  | { type: "move"; by: -1 | 1 }
  | { type: "remove"; index: number }
  | { type: "import"; parts: Part[]; replace: boolean; revert?: Song }
  | { type: "restore"; songs: Song[]; current: number }
  | { type: "date"; date: string }
  | { type: "dateFmt"; fmt: DateFormat }
  | { type: "opts"; patch: Partial<SplitOptions> }
  | { type: "view"; view: View };

const nextId = (songs: Song[]) => songs.reduce((m, s) => Math.max(m, s.id), 0) + 1;
const blank = (s: Song) => !s.title.trim() && !s.text.trim();

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "select":
      return { ...state, current: a.index };
    case "add":
      return { ...state, songs: [...state.songs, { id: nextId(state.songs), title: "", text: "" }], current: state.songs.length };
    case "edit":
      return { ...state, songs: state.songs.map((s, i) => (i === state.current ? { ...s, ...a.patch } : s)) };
    case "move": {
      const i = state.current;
      const j = i + a.by;
      if (j < 0 || j >= state.songs.length) return state;
      const songs = [...state.songs];
      [songs[i], songs[j]] = [songs[j], songs[i]];
      return { ...state, songs, current: j };
    }
    case "remove": {
      let songs = state.songs.filter((_, i) => i !== a.index);
      if (!songs.length) songs = [{ id: nextId(state.songs), title: "", text: "" }];
      const current = state.current > a.index || state.current >= songs.length ? Math.max(0, state.current - 1) : state.current;
      return { ...state, songs, current };
    }
    case "import": {
      // A big paste that turned out to hold several songs: put the song it was pasted into back first.
      let base = state.songs;
      if (a.revert) {
        const r = a.revert;
        base = base.flatMap((s) => (s.id !== r.id ? [s] : blank(r) ? [] : [r]));
      }
      if (a.replace) base = [];
      let id = nextId([...state.songs, ...base]);
      const added = a.parts.map((p) => ({ id: id++, title: p.title, text: p.text }));
      return { ...state, songs: [...base, ...added], current: base.length };
    }
    case "restore":
      return { ...state, songs: a.songs, current: a.current };
    case "date":
      return { ...state, date: a.date };
    case "dateFmt":
      return { ...state, dateFmt: a.fmt };
    case "opts":
      return { ...state, opts: { ...state.opts, ...a.patch } };
    case "view":
      return { ...state, view: a.view };
  }
}

function initial(): AppState {
  const saved = load();
  const sunday = nextSunday();
  const base: AppState = {
    songs: SAMPLE_SONGS.map((p, i) => ({ id: i + 1, ...p })),
    current: 0,
    date: sunday,
    dateFmt: "dmy",
    opts: { ...DEFAULT_OPTIONS },
    view: "slides",
  };
  const s = { ...base, ...saved };
  // a service date in the past rolls forward to the coming Sunday
  if (!s.date || s.date < sunday) s.date = sunday;
  return s;
}

/** The app's state, saved to browser storage on every change. */
export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  useEffect(() => save(state), [state]);
  return [state, dispatch] as const;
}
