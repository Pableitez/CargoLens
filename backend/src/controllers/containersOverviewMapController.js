import mongoose from "mongoose";
import { isDbConnected } from "../db.js";
import { SavedContainer } from "../models/SavedContainer.js";
import { getEnv } from "../config/env.js";
import { carrierFromContainerNumber } from "../services/tracking/carrierFromPrefix.js";
import { fetchSafecubeShipmentWithSealineFallback } from "../services/tracking/safecubeClient.js";
import { buildOverviewFromDetail } from "../services/tracking/overviewMapPayload.js";
import { normalizeLatLng } from "../utils/coords.js";
import { devError } from "../utils/devLog.js";

// Vista previa / mapa: solo filas marcadas API operador (con tope).
const MAX_ACTIVE = Math.min(
  24,
  Math.max(4, Number(process.env.SAFECUBE_OVERVIEW_MAX_CONTAINERS) || 12)
);
const MAX_COMPLETED = Math.min(
  100,
  Math.max(4, Number(process.env.SAFECUBE_OVERVIEW_MAX_COMPLETED) || 30)
);

const BETWEEN_MS = 80;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function dbUnavailable(res) {
  return res.status(503).json({
    error: "DB_UNAVAILABLE",
    message: "Database not configured or unreachable.",
  });
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(31, h) + str.charCodeAt(i);
  return Math.abs(h);
}

function futureIsoDays(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function normalizeEntrySource(raw) {
  if (raw === "import") return "import";
  if (raw === "seed") return "seed";
  if (raw === "api") return "api";
  return "manual";
}

const DUMMY_ROUTES = [
  { polPort: "Shanghai (CNSHA)", polLocode: "CNSHA", podPort: "Rotterdam (NLRTM)", podLocode: "NLRTM" },
  { polPort: "Busan (KRPUS)", polLocode: "KRPUS", podPort: "Los Angeles (USLAX)", podLocode: "USLAX" },
  { polPort: "Singapore (SGSIN)", polLocode: "SGSIN", podPort: "Felixstowe (GBFXT)", podLocode: "GBFXT" },
  { polPort: "Qingdao (CNTAO)", polLocode: "CNTAO", podPort: "Hamburg (DEHAM)", podLocode: "DEHAM" },
  { polPort: "Ningbo (CNNGB)", polLocode: "CNNGB", podPort: "New York (USNYC)", podLocode: "USNYC" },
  { polPort: "Ho Chi Minh (VNSGN)", polLocode: "VNSGN", podPort: "Barcelona (ESBCN)", podLocode: "ESBCN" },
  { polPort: "Port Klang (MYPKG)", polLocode: "MYPKG", podPort: "Valencia (ESVLC)", podLocode: "ESVLC" },
  { polPort: "Kaohsiung (TWKHH)", polLocode: "TWKHH", podPort: "Savannah (USSAV)", podLocode: "USSAV" },
  { polPort: "Jakarta (IDJKT)", polLocode: "IDJKT", podPort: "Le Havre (FRLEH)", podLocode: "FRLEH" },
  { polPort: "Colombo (LKCMB)", polLocode: "LKCMB", podPort: "Genoa (ITGOA)", podLocode: "ITGOA" },
];

const DUMMY_VESSELS = [
  "MSC MAYA",
  "EVER ACE",
  "MAERSK MC-KINNEY MÖLLER",
  "MSC GÜLSÜN",
  "HMM ALGECIRAS",
  "CMA CGM ANTOINE DE SAINT EXUPÉRY",
  "ONE INNOVATION",
  "EVER ARIA",
  "COSCO SHIPPING UNIVERSE",
  "OOCL HONG KONG",
  "EVERGREEN A-class",
  "MSC ISABELLA",
];

function pickDummyRoute(seed) {
  return DUMMY_ROUTES[seed % DUMMY_ROUTES.length];
}

function pickDummyVessel(seed) {
  return DUMMY_VESSELS[seed % DUMMY_VESSELS.length];
}

// Sin API key: datos ilustrativos solo para filas ya etiquetadas como API.
function mockMapItem(row, trackingDataSource) {
  const containerNumber = row.containerNumber;
  const seed = hashSeed(containerNumber);
  const lat = 25 + (seed % 80) / 20;
  const lng = -80 + (seed % 120) / 15;
  const pos = { lat, lng };
  const eta = futureIsoDays(3 + (seed % 5));
  const etd = futureIsoDays(-8 - (seed % 10));
  const lifecycleStatus = row.lifecycleStatus === "completed" ? "completed" : "active";
  const entrySource = normalizeEntrySource(row.entrySource);

  const route = pickDummyRoute(seed);
  const vesselName = pickDummyVessel(seed);

  let statusLabel;
  if (lifecycleStatus === "completed") {
    statusLabel = "Completed";
  } else if (entrySource === "api") {
    statusLabel = "Active";
  } else if (entrySource === "seed") {
    statusLabel = "Demo";
  } else {
    statusLabel = "Saved";
  }

  return {
    savedContainerId: String(row._id),
    containerNumber,
    ok: true,
    trackingDataSource,
    entrySource,
    lifecycleStatus,
    clientId: row.clientId ? String(row.clientId) : "",
    clientName: row.clientName || "",
    notes: row.notes || "",
    position: pos,
    status: lifecycleStatus === "completed" ? "COMPLETED" : "SAVED",
    statusLabel,
    vesselName,
    polPort: route.polPort,
    podPort: route.podPort,
    polLocode: route.polLocode,
    podLocode: route.podLocode,
    etdAt: etd,
    etaAt: eta,
    routePaths: [
      [
        [pos.lat - 2, pos.lng + 3],
        [pos.lat, pos.lng],
        [pos.lat + 1.5, pos.lng - 4],
      ],
    ],
  };
}

function buildFailedMapItem(row, errMsg) {
  const lifecycleStatus = row.lifecycleStatus === "completed" ? "completed" : "active";
  return {
    savedContainerId: String(row._id),
    containerNumber: row.containerNumber,
    ok: false,
    error: String(errMsg || "Operator request failed"),
    trackingDataSource: "manual",
    entrySource: "api",
    lifecycleStatus,
    clientId: row.clientId ? String(row.clientId) : "",
    clientName: row.clientName || "",
    notes: row.notes || "",
    status: "UNKNOWN",
    statusLabel: lifecycleStatus === "completed" ? "Completed" : "—",
    vesselName: "",
    polPort: "—",
    podPort: "—",
    polLocode: "",
    podLocode: "",
    etdAt: null,
    etaAt: null,
    routePaths: [],
  };
}

function buildLiveMapItem(row, built) {
  const lifecycleStatus = row.lifecycleStatus === "completed" ? "completed" : "active";
  let position = built.position ? normalizeLatLng(built.position.lat, built.position.lng) : null;
  const routePaths = Array.isArray(built.routePaths) ? built.routePaths : [];
  const p0 = routePaths[0]?.[0];
  if (!position && p0?.length >= 2) {
    position = normalizeLatLng(p0[0], p0[1]);
  }
  const hasPolyline = routePaths.some((p) => Array.isArray(p) && p.length >= 2);
  const hasMap = Boolean(position || hasPolyline);

  return {
    savedContainerId: String(row._id),
    containerNumber: row.containerNumber,
    ok: hasMap,
    trackingDataSource: "live",
    entrySource: "api",
    lifecycleStatus,
    clientId: row.clientId ? String(row.clientId) : "",
    clientName: row.clientName || "",
    notes: row.notes || "",
    position: position ?? undefined,
    status: built.status ?? "UNKNOWN",
    statusLabel: built.statusLabel ?? (lifecycleStatus === "completed" ? "Completed" : "Active"),
    vesselName: built.vesselName ?? "",
    polPort: built.polPort ?? "—",
    podPort: built.podPort ?? "—",
    polLocode: built.polLocode ?? "",
    podLocode: built.podLocode ?? "",
    etdAt: built.etdAt,
    etaAt: built.etaAt,
    routePaths,
  };
}

async function mapRowsWithSafecube(rows, safecubeApiKey) {
  const out = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const cn = row.containerNumber;
    try {
      const carrier = carrierFromContainerNumber(cn);
      const sealineGuess = carrier.id !== "unknown" ? cn.slice(0, 4) : undefined;
      const detail = await fetchSafecubeShipmentWithSealineFallback(safecubeApiKey, cn, sealineGuess);
      const built = buildOverviewFromDetail(detail);
      out.push(buildLiveMapItem(row, built));
    } catch (err) {
      out.push(buildFailedMapItem(row, err.message));
    }
    if (i < rows.length - 1) await delay(BETWEEN_MS);
  }
  return out;
}

export async function overviewMap(req, res) {
  if (!isDbConnected()) return dbUnavailable(res);

  const companyId = req.user.companyId;
  const q = { companyId: new mongoose.Types.ObjectId(companyId) };

  if (req.user.clientId) {
    q.clientId = new mongoose.Types.ObjectId(req.user.clientId);
  }

  try {
    const totalRows = await SavedContainer.countDocuments(q);
    if (totalRows === 0) {
      return res.json({ mode: "empty", items: [], itemsCompleted: [], counts: { activeApi: 0, completedApi: 0 } });
    }

    const activeQ = { ...q, lifecycleStatus: { $ne: "completed" }, entrySource: "api" };
    const completedQ = { ...q, lifecycleStatus: "completed", entrySource: "api" };

    const [activeRows, completedRows, activeApiCount, completedApiCount] = await Promise.all([
      SavedContainer.find(activeQ).sort({ updatedAt: -1 }).limit(MAX_ACTIVE).lean(),
      SavedContainer.find(completedQ).sort({ updatedAt: -1 }).limit(MAX_COMPLETED).lean(),
      SavedContainer.countDocuments(activeQ),
      SavedContainer.countDocuments(completedQ),
    ]);

    const { safecubeApiKey } = getEnv();
    const hasKey = Boolean(safecubeApiKey);

    const hint = hasKey
      ? "Preview and map show only operator API shipments. Routes and positions come from Sinay when each request succeeds."
      : "Preview and map show only operator API–tagged containers. Set SAFECUBE_API_KEY on the server for live operator routes; without it, positions are illustrative.";

    let items;
    let itemsCompleted;

    if (hasKey) {
      items = await mapRowsWithSafecube(activeRows, safecubeApiKey);
      itemsCompleted = await mapRowsWithSafecube(completedRows, safecubeApiKey);
    } else {
      items = activeRows.map((r) => mockMapItem(r, "mock"));
      itemsCompleted = completedRows.map((r) => mockMapItem(r, "mock"));
    }

    return res.json({
      mode: hasKey ? "manual" : "mock",
      hint,
      items,
      itemsCompleted,
      counts: { activeApi: activeApiCount, completedApi: completedApiCount },
    });
  } catch (err) {
    devError(err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to build overview map." });
  }
}
