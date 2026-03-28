// ISO 6346: prefijo → naviera (mapa simplificado).
const PREFIX_TO_CARRIER = {
  MAEU: { id: "maersk", name: "Maersk Line" },
  MSCU: { id: "msc", name: "MSC" },
  MEDU: { id: "msc", name: "MSC" },
  CMAU: { id: "cma-cgm", name: "CMA CGM" },
  ECMU: { id: "cma-cgm", name: "CMA CGM" },
  HLCU: { id: "hapag", name: "Hapag-Lloyd" },
  HMMU: { id: "hyundai", name: "HMM" },
  ONEU: { id: "one", name: "Ocean Network Express" },
  EGLV: { id: "evergreen", name: "Evergreen" },
  TEMU: { id: "triton", name: "Triton (leasing)" },
};

export function carrierFromContainerNumber(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (cleaned.length < 4) return { id: "unknown", name: "Unknown carrier" };
  const prefix = cleaned.slice(0, 4);
  return PREFIX_TO_CARRIER[prefix] ?? { id: "unknown", name: "Unknown carrier" };
}
