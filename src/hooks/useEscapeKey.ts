import { useEffect, useRef } from "react";

/** Calls `onEscape` when the Escape key is pressed while `active` is true. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  const handler = useRef(onEscape);
  useEffect(() => {
    handler.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") handler.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
