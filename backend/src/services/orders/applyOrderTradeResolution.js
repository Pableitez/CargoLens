import {
  companyUsesTradeMasters,
  resolveOrderTrade,
  resolveOrderTradeFromSelection,
} from "../tradeMasters/resolveOrderTrade.js";
import { applyOrderFacilityResolution } from "../tradeMasters/partyFacilityOptions.js";

const TRADE_ID_FIELDS = [
  "contractualPartyId",
  "supplyChainId",
  "operatingShipperPartyId",
  "operatingConsigneePartyId",
];

const FACILITY_ID_FIELDS = [
  "placeOfReceiptFacilityId",
  "portOfLoadingFacilityId",
  "portOfDischargeFacilityId",
  "placeOfDeliveryFacilityId",
];

function hasAnyFacilitySelection(body) {
  return FACILITY_ID_FIELDS.some((field) => String(body?.[field] ?? "").trim());
}

function hasTradeSelection(body) {
  return (
    String(body?.contractualPartyId ?? "").trim() &&
    String(body?.operatingShipperPartyId ?? "").trim() &&
    String(body?.operatingConsigneePartyId ?? "").trim()
  );
}

function hasAnyTradeSelection(body) {
  return TRADE_ID_FIELDS.some((field) => String(body?.[field] ?? "").trim());
}

function applyChainDefaults(body, trade, { fillEmptyOnly = true } = {}) {
  const merged = { ...body };
  const pairs = [
    ["incoterm", "defaultIncoterm"],
    ["transportMode", "defaultTransportMode"],
    ["portOfLoading", "defaultPortOfLoading"],
    ["portOfDischarge", "defaultPortOfDischarge"],
  ];

  for (const [bodyKey, tradeKey] of pairs) {
    const current = merged[bodyKey];
    const next = trade[tradeKey];
    if (!next) continue;
    if (fillEmptyOnly && current !== undefined && current !== null && String(current).trim() !== "") {
      continue;
    }
    merged[bodyKey] = next;
  }

  return merged;
}

function mergeTradeFields(body, trade, { fillEmptyOnly = true } = {}) {
  const merged = applyChainDefaults(
    {
      ...body,
      customer: trade.customer,
      shipper: trade.shipper,
      consignee: trade.consignee,
      contractualPartyId: trade.contractualPartyId,
      supplyChainId: trade.supplyChainId,
      operatingShipperPartyId: trade.operatingShipperPartyId,
      operatingConsigneePartyId: trade.operatingConsigneePartyId,
    },
    trade,
    { fillEmptyOnly }
  );

  return merged;
}

/**
 * Aplica resolución de maestros comerciales al payload de create/update de pedidos.
 */
export async function applyOrderTradeResolution(companyId, body, { partial = false } = {}) {
  const usesTradeMasters = await companyUsesTradeMasters(companyId);
  if (!usesTradeMasters) {
    return { errors: [], data: body };
  }

  if (partial && !hasAnyTradeSelection(body) && !hasAnyFacilitySelection(body)) {
    return { errors: [], data: body };
  }

  if (hasTradeSelection(body)) {
    const resolved = await resolveOrderTradeFromSelection(companyId, body);
    if (resolved.errors.length > 0) {
      return { errors: resolved.errors, data: null };
    }
    const merged = mergeTradeFields(body, resolved.data, { fillEmptyOnly: partial });
    const facilityResult = await applyOrderFacilityResolution(companyId, merged, { partial });
    if (facilityResult.errors.length > 0) {
      return { errors: facilityResult.errors, data: null };
    }
    return {
      errors: [],
      data: facilityResult.data,
    };
  }

  if (body.customer && !hasTradeSelection(body)) {
    const resolved = await resolveOrderTrade(companyId, {
      contractualCode: body.customer,
      operatingShipperCode: body.shipper,
      operatingConsigneeCode: body.consignee,
    });
    if (resolved.errors.length > 0) {
      return { errors: resolved.errors, data: null };
    }
    const merged = mergeTradeFields(body, resolved.data, { fillEmptyOnly: partial });
    const facilityResult = await applyOrderFacilityResolution(companyId, merged, { partial });
    if (facilityResult.errors.length > 0) {
      return { errors: facilityResult.errors, data: null };
    }
    return {
      errors: [],
      data: facilityResult.data,
    };
  }

  const facilityOnly = await applyOrderFacilityResolution(companyId, body, { partial });
  if (facilityOnly.errors.length > 0) {
    return { errors: facilityOnly.errors, data: null };
  }
  if (partial && facilityOnly.data !== body) {
    return { errors: [], data: facilityOnly.data };
  }

  return {
    errors: [
      "Select contractual customer and choose shipper and consignee from party relationships in Trade setup.",
    ],
    data: null,
  };
}
