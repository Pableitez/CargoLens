import { useLayoutEffect, useState } from "react";

export const SIDEBAR_FLYOUT_BREAKPOINT = 961;

export function isDesktopSidebarFlyout() {
  return (
    typeof window !== "undefined" && window.matchMedia(`(min-width: ${SIDEBAR_FLYOUT_BREAKPOINT}px)`).matches
  );
}

/** Posición fixed del panel flyout (viewport), sin ensanchar el layout. */
export function useFlyoutPanelStyle(open, flyout, anchorRef) {
  const [style, setStyle] = useState(undefined);

  useLayoutEffect(() => {
    if (!open || !flyout || !isDesktopSidebarFlyout()) {
      setStyle(undefined);
      return undefined;
    }

    const anchor = anchorRef.current;
    if (!anchor) return undefined;

    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 8;
      const margin = 12;
      const width = Math.min(280, Math.max(220, window.innerWidth - rect.right - gap - margin));
      const maxHeight = Math.min(480, window.innerHeight - margin * 2);
      let top = rect.top;
      if (top + maxHeight > window.innerHeight - margin) {
        top = Math.max(margin, window.innerHeight - maxHeight - margin);
      }

      setStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${rect.right + gap}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, flyout, anchorRef]);

  return style;
}
