const RECENT_ROUTES = "naolab-recent-routes";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorar
  }
}

export function pushRecentRoute(path) {
  if (!path || path === "/") return;
  const prev = readJson(RECENT_ROUTES, []);
  const next = [path, ...prev.filter((p) => p !== path)].slice(0, 10);
  writeJson(RECENT_ROUTES, next);
}

export function getRecentRoutes() {
  return readJson(RECENT_ROUTES, []);
}
