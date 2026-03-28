import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollToIdWithRetry(id, attemptsLeft) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (attemptsLeft <= 0) return;
  window.setTimeout(() => scrollToIdWithRetry(id, attemptsLeft - 1), 60);
}

// Sin hash: scroll al inicio al cambiar ruta. Con hash: ir al elemento (rutas lazy pueden tardar).
export function RouteScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    if (id) scrollToIdWithRetry(id, 25);
  }, [location.pathname, location.hash, location.search]);

  return null;
}
