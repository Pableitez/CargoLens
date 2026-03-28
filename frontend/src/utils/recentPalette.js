const RECENT_ROUTES = "freightboard-recent-routes";
const PALETTE_CONTAINERS = "freightboard-palette-containers";
// Contenedores ocultos en la paleta (sigue sincronizado; se filtra al leer).
const PALETTE_HIDDEN = "freightboard-palette-hidden";

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

function normalizeCn(s) {
  return String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

// Últimas rutas visitadas para la paleta (máx. 10).
export function pushRecentRoute(path) {
  if (!path || path === "/") return;
  const prev = readJson(RECENT_ROUTES, []);
  const next = [path, ...prev.filter((p) => p !== path)].slice(0, 10);
  writeJson(RECENT_ROUTES, next);
}

export function getRecentRoutes() {
  return readJson(RECENT_ROUTES, []);
}

// Números guardados para abrir rápido (desde workspace).
export function setPaletteContainerNumbers(nums) {
  writeJson(PALETTE_CONTAINERS, Array.isArray(nums) ? nums.slice(0, 80) : []);
}

// Ocultar un contenedor en la paleta hasta limpiar almacenamiento.
export function hidePaletteContainerNumber(cn) {
  const norm = normalizeCn(cn);
  if (!norm) return;
  const prev = readJson(PALETTE_HIDDEN, []);
  if (prev.includes(norm)) return;
  writeJson(PALETTE_HIDDEN, [...prev, norm].slice(0, 200));
}

export function getPaletteContainerNumbers() {
  const nums = readJson(PALETTE_CONTAINERS, []);
  const hidden = new Set(readJson(PALETTE_HIDDEN, []).map((x) => normalizeCn(x)));
  return nums.filter((n) => !hidden.has(normalizeCn(n)));
}
