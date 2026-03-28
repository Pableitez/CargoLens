import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pushRecentRoute } from "../utils/recentPalette.js";

// Guarda rutas recientes para la paleta de comandos.
export function RouteRecentHook() {
  const location = useLocation();

  useEffect(() => {
    pushRecentRoute(`${location.pathname}${location.search || ""}`);
  }, [location.pathname, location.search]);

  return null;
}
