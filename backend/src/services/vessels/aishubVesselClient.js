import { normalizeLatLng } from "../../utils/coords.js";

// AISHub (usuario gratuito); ~1 req/min; una llamada por búsqueda de buque.
export async function fetchAishubPositionByMmsi(username, mmsi) {
  const u = String(username ?? "").trim();
  const m = String(mmsi ?? "").trim();
  if (!u || !m) return null;

  const params = new URLSearchParams({
    username: u,
    format: "1",
    output: "json",
    compress: "0",
    mmsi: m,
  });
  const url = `https://data.aishub.net/ws.php?${params.toString()}`;

  const res = await fetch(url);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    return null;
  }

  if (!Array.isArray(body) || body.length < 2) return null;
  const meta = body[0];
  if (meta?.ERROR === true) return null;
  const rows = body[1];
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const v = rows[0];
  const lat = v.LATITUDE ?? v.latitude;
  const lng = v.LONGITUDE ?? v.longitude;
  const p = normalizeLatLng(lat, lng);
  if (!p) return null;

  const sog = v.SOG ?? v.sog;
  const cog = v.COG ?? v.cog;
  return {
    latitude: p.lat,
    longitude: p.lng,
    speed: sog != null && sog !== "" && !Number.isNaN(Number(sog)) ? Number(sog) : undefined,
    course: cog != null && cog !== "" && !Number.isNaN(Number(cog)) ? Number(cog) : undefined,
    lastUpdate: v.TIME != null ? String(v.TIME) : undefined,
  };
}
