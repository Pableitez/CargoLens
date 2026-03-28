import { carrierFromContainerNumber } from "./carrierFromPrefix.js";

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = Math.imul(31, h) + str.charCodeAt(i);
  return Math.abs(h);
}

// Mock determinista: mismo ISO → mismo payload demo.
export function buildMockShipment(containerNumber) {
  const cleaned = String(containerNumber ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const carrier = carrierFromContainerNumber(cleaned);
  const seed = hashSeed(cleaned || "demo");

  const lat = 35 + (seed % 100) / 200;
  const lng = -20 - (seed % 120) / 200;

  const statuses = ["IN_TRANSIT", "AT_PORT", "CUSTOMS", "DELIVERED"];
  const status = statuses[seed % statuses.length];

  const vesselNames = [
    "MAERSK MC-KINNEY MØLLER",
    "MSC GÜLSÜN",
    "CMA CGM ANTOINE DE SAINT EXUPÉRY",
  ];
  const vesselName = vesselNames[seed % vesselNames.length];
  const imo = String(9000000 + (seed % 999999));
  const mmsi = String(200000000 + (seed % 99999999));

  const etaDate = futureIsoDays(3 + (seed % 5));
  const now = new Date().toISOString();

  return {
    containerNumber: cleaned || "DEMO0000000",
    carrier: { ...carrier, scac: cleaned.length >= 4 ? cleaned.slice(0, 4) : null },
    shipmentType: "CT",
    status,
    statusLabel: labelForStatus(status),
    rawShippingStatus: status,
    summary:
      status === "IN_TRANSIT"
        ? "In transit — simulated AIS position for demo"
        : "Port / admin milestone (demo data)",
    updatedAt: now,
    container: {
      number: cleaned || "DEMO0000000",
      isoCode: "45G1",
      sizeType: "40' High Cube Dry",
      status: "IN_TRANSIT",
    },
    vessel: {
      name: vesselName,
      imo,
      mmsi,
      callSign: `C${String(seed % 10000).padStart(4, "0")}`,
      flag: "DK",
    },
    position: { lat, lng },
    positionSource: "ais",
    ais: {
      lastVesselPosition: { lat, lng },
      updatedAt: now,
    },
    coordinatesLabel: `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
    eta: {
      port: "Algeciras (ESALG)",
      locode: "ESALG",
      date: etaDate,
    },
    routeMilestones: [
      {
        key: "Port of loading",
        locode: "NLRTM",
        title: "Rotterdam, Netherlands",
        date: futureIsoDays(20),
        actual: true,
        predictiveEta: null,
      },
      {
        key: "Port of discharge",
        locode: "ESALG",
        title: "Algeciras, Spain",
        date: etaDate,
        actual: false,
        predictiveEta: null,
      },
    ],
    locations: [
      { id: "loc-0", name: "Rotterdam", locode: "NLRTM", country: "Netherlands", lat: 51.9, lng: 4.45 },
      { id: "loc-1", name: "Algeciras", locode: "ESALG", country: "Spain", lat: 36.13, lng: -5.45 },
    ],
    timeline: buildTimeline(seed),
    routePaths: [
      [
        [51.92, 4.42],
        [45.2, -12.1],
        [36.13, -5.45],
      ],
    ],
    source: "mock",
  };
}

function labelForStatus(s) {
  const map = {
    IN_TRANSIT: "In transit",
    AT_PORT: "At port",
    CUSTOMS: "Customs / clearance",
    DELIVERED: "Delivered",
  };
  return map[s] ?? s;
}

function futureIsoDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildTimeline(seed) {
  const base = new Date();
  const days = (n) => {
    const x = new Date(base);
    x.setDate(x.getDate() - n);
    return x.toISOString();
  };
  return [
    { label: "Empty pick-up", place: "Rotterdam", date: days(18), actual: true, code: "GTOT", id: `ev-${seed}-0` },
    { label: "Loaded on vessel", place: "Rotterdam", date: days(16), actual: true, code: "LOAD", id: `ev-${seed}-1` },
    { label: "Vessel departed", place: "Rotterdam", date: days(15), actual: true, code: "DEPA", id: `ev-${seed}-2` },
    { label: "In transit", place: "North Atlantic", date: days(8), actual: true, code: null, id: `ev-${seed}-3` },
    { label: "ETA destination", place: "Algeciras", date: days(0), actual: false, code: null, id: `ev-${seed}-4` },
  ].map((e, i) => ({ ...e, routeType: e.label.includes("vessel") ? "SEA" : "LAND" }));
}
