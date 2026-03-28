// Mapas base Carto para Leaflet; acoplados al tema claro/oscuro.
export const CARTO_TILE_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const CARTO_TILE_LIGHT =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export function cartoTileUrl(theme) {
  return theme === "light" ? CARTO_TILE_LIGHT : CARTO_TILE_DARK;
}
