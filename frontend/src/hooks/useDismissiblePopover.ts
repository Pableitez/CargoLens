import { useEffect, type RefObject } from "react";

export function useDismissiblePopover(
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, onDismiss, enabled]);
}
