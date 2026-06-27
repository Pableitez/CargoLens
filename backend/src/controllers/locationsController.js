import { searchLocations } from "../data/locations.js";

export function listLocations(req, res) {
  const q = String(req.query.q ?? "").trim();
  const limit = Math.min(Number(req.query.limit ?? 12) || 12, 50);
  return res.json({ items: searchLocations(q, limit) });
}
