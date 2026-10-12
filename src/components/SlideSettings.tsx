import type { SplitOptions } from "../core/index.ts";
import { Icon } from "./Icon.tsx";
import { Popover } from "./Popover.tsx";

const CHECKS: { key: "stripEnd" | "cap" | "expand" | "labels"; label: string }[] = [
  { key: "stripEnd", label: "Drop commas at line ends" },
  { key: "cap", label: "Capitalise each line" },
  { key: "expand", label: "Repeat sections marked (x2)" },
  { key: "labels", label: "Put section names in the text" },
];

export function SlideSettings({ opts, onChange }: { opts: SplitOptions; onChange: (patch: Partial<SplitOptions>) => void }) {
  return (
    <Popover
      label="Slide settings"
      trigger={({ open, toggle }) => (
        <button className="icon ghost" type="button" aria-label="Slide settings" title="Slide settings" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
          <Icon name="sliders" />
        </button>
      )}
    >
      {() => (
        <>
          <div className="label">Slide settings · all songs</div>
          <div className="settings">
            <label className="opt">
              <span>Lines per slide</span>
              <select value={opts.maxLines} onChange={(e) => onChange({ maxLines: Number(e.target.value) })}>
                <option value={1}>1 line</option>
                <option value={2}>2 lines</option>
                <option value={3}>3 lines</option>
              </select>
            </label>
            <label className="opt">
              <span>Max characters</span>
              <input
                type="number"
                inputMode="numeric"
                min={12}
                max={80}
                value={opts.maxChars}
                onChange={(e) => onChange({ maxChars: Math.min(80, Math.max(12, Number(e.target.value) || 32)) })}
              />
            </label>
            <label className="opt wide">
              <span>Break lines at</span>
              <select value={opts.mode} onChange={(e) => onChange({ mode: e.target.value as SplitOptions["mode"] })}>
                <option value="pack">Commas, joining short phrases</option>
                <option value="every">Every comma</option>
              </select>
            </label>
            <label className="opt wide">
              <span>Also break at</span>
              <select value={opts.punct} onChange={(e) => onChange({ punct: e.target.value })}>
                <option value=",;:!?.">; : ! ? .</option>
                <option value=",;">; only</option>
                <option value=",">Commas only</option>
              </select>
            </label>
            {CHECKS.map((c) => (
              <label key={c.key} className="opt check wide">
                <input type="checkbox" checked={opts[c.key]} onChange={(e) => onChange({ [c.key]: e.target.checked })} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </Popover>
  );
}
