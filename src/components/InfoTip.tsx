import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "../hooks/useDismiss.ts";

/** An ⓘ that shows details on hover or focus, and toggles on tap for touch screens. */
export function InfoTip({ label, children, place = "" }: { label: string; children: ReactNode; place?: "" | "right" | "right up" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  return (
    <span className={`tipwrap${open ? " open" : ""}`} ref={ref}>
      <button className="info" type="button" aria-label={label} aria-describedby={id} onClick={() => setOpen((o) => !o)}>
        i
      </button>
      <span className={`tip ${place}`} role="tooltip" id={id}>
        {children}
      </span>
    </span>
  );
}
