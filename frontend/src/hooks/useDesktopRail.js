import { useEffect, useState } from "react";

const DESKTOP_RAIL_QUERY = "(min-width: 960px)";

/** Desktop uses the permanent icon rail; mobile drawer keeps full labels. */
export function useDesktopRail() {
  const [desktopRail, setDesktopRail] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_RAIL_QUERY).matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_RAIL_QUERY);
    const sync = () => setDesktopRail(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return desktopRail;
}
