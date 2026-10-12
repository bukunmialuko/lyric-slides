import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDismiss } from "../hooks/useDismiss.ts";

interface Props {
  /** Renders the trigger button. */
  trigger: (p: { open: boolean; toggle: () => void }) => ReactNode;
  /** Renders the panel; `close` hides it. */
  children: (close: () => void) => ReactNode;
  label: string;
  role?: "dialog" | "menu";
  align?: "left" | "right";
  onOpen?: () => void;
}

/** A button that opens a small floating panel: the Import menu, Download all, slide settings. */
export function Popover({ trigger, children, label, role = "dialog", align = "right", onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const toggle = () => {
    if (!open) onOpen?.();
    setOpen((o) => !o);
  };
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>("button, select, input")?.focus({ preventScroll: true });
  }, [open]);
  return (
    <span className="popwrap" ref={ref}>
      {trigger({ open, toggle })}
      {open && (
        <div className={`pop${align === "left" ? " left" : ""}`} role={role} aria-label={label} ref={panel}>
          {children(close)}
        </div>
      )}
    </span>
  );
}
