import { useCallback, useRef, useState } from "react";
import { fetchTrackingByQuery } from "../api/tracking.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

const TRACK_DASH_CACHE_PREFIX = "fb.trackDash.";
const TRACK_DASH_CACHE_MS = 45 * 60 * 1000;

function normalizeCacheKey(raw) {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function readTrackDashCache(cn) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRACK_DASH_CACHE_PREFIX + cn);
    if (!raw) return null;
    const { at, payload } = JSON.parse(raw);
    if (!payload || Date.now() - at > TRACK_DASH_CACHE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeTrackDashCache(cn, payload) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      TRACK_DASH_CACHE_PREFIX + cn,
      JSON.stringify({ at: Date.now(), payload })
    );
  } catch {
    // cuota
  }
}

// Búsqueda de tracking; persistSession=true guarda cargas OK en sessionStorage (embed del overview con ?q=).
export function useTrackingSearch(opts = {}) {
  const { persistSession = false } = opts;
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const genRef = useRef(0);
  const persistRef = useRef(persistSession);
  persistRef.current = persistSession;

  const hydrateFromSession = useCallback((raw) => {
    const q = String(raw ?? "").trim();
    if (q.length < 4) return false;
    const cn = normalizeCacheKey(q);
    const payload = readTrackDashCache(cn);
    if (!payload) return false;
    genRef.current += 1;
    setData(payload);
    setError(null);
    setLoading(false);
    return true;
  }, []);

  // Devuelve true si la respuesta del operador se aplicó bien.
  const search = useCallback(
    async (raw) => {
      const q = String(raw ?? "").trim();
      if (q.length < 4) {
        setError(t("track.errors.minChars"));
        setData(null);
        return false;
      }
      const myGen = ++genRef.current;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchTrackingByQuery(q);
        if (genRef.current !== myGen) return false;
        setData(res);
        if (persistRef.current) {
          const key = normalizeCacheKey(res?.containerNumber ?? q);
          if (key.length >= 4) writeTrackDashCache(key, res);
        }
        return true;
      } catch (e) {
        if (genRef.current !== myGen) return false;
        const msg = e.response?.data?.message ?? e.message ?? t("track.errors.loadFailed");
        setError(msg);
        setData(null);
        return false;
      } finally {
        if (genRef.current === myGen) setLoading(false);
      }
    },
    [t]
  );

  const clear = useCallback(() => {
    genRef.current += 1;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, search, clear, hydrateFromSession };
}
