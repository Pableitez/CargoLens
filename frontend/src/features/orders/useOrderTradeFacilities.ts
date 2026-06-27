import { useCallback, useEffect, useMemo, useState } from "react";
import * as ordersApi from "../../api/orders";
import type { EntitySearchOption } from "../../components/EntitySearchPicker";
import type { OrderChainDefaults } from "./useOrderTradeSetup";

export type TradeFacilityOption = {
  facilityId: string;
  code: string;
  name: string;
  facilityType: string;
  city: string;
  country: string;
  locationCode: string;
  purpose: string;
  isPrimary: boolean;
};

export type TradeFacilitySlot = "placeOfReceipt" | "portOfLoading" | "portOfDischarge" | "placeOfDelivery";

export type TradeFacilityOptionsMap = Record<TradeFacilitySlot, TradeFacilityOption[]>;

const EMPTY_OPTIONS: TradeFacilityOptionsMap = {
  placeOfReceipt: [],
  portOfLoading: [],
  portOfDischarge: [],
  placeOfDelivery: [],
};

const SLOT_ID_FIELD: Record<TradeFacilitySlot, keyof OrderLocationFacilityIds> = {
  placeOfReceipt: "placeOfReceiptFacilityId",
  portOfLoading: "portOfLoadingFacilityId",
  portOfDischarge: "portOfDischargeFacilityId",
  placeOfDelivery: "placeOfDeliveryFacilityId",
};

const SLOT_TEXT_FIELD: Record<TradeFacilitySlot, keyof OrderLocationFacilityIds> = {
  placeOfReceipt: "placeOfReceipt",
  portOfLoading: "portOfLoading",
  portOfDischarge: "portOfDischarge",
  placeOfDelivery: "placeOfDelivery",
};

export type OrderLocationFacilityIds = {
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  placeOfReceiptFacilityId: string;
  portOfLoadingFacilityId: string;
  portOfDischargeFacilityId: string;
  placeOfDeliveryFacilityId: string;
};

function facilityLabel(option: TradeFacilityOption): string {
  const meta = [option.code, option.locationCode, option.city].filter(Boolean).join(" · ");
  return meta ? `${option.name} (${meta})` : option.name;
}

function toEntityOption(option: TradeFacilityOption): EntitySearchOption {
  return {
    id: option.facilityId,
    label: option.name,
    meta: option.locationCode || option.code,
  };
}

type UseOrderTradeFacilitiesOptions = {
  enabled: boolean;
  operatingShipperPartyId: string;
  operatingConsigneePartyId: string;
  selection: OrderLocationFacilityIds;
  onAutoSelect?: (patch: Partial<OrderLocationFacilityIds>) => void;
  chainDefaults?: OrderChainDefaults | null;
};

export function useOrderTradeFacilities({
  enabled,
  operatingShipperPartyId,
  operatingConsigneePartyId,
  selection,
  onAutoSelect,
  chainDefaults,
}: UseOrderTradeFacilitiesOptions) {
  const [options, setOptions] = useState<TradeFacilityOptionsMap>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || (!operatingShipperPartyId.trim() && !operatingConsigneePartyId.trim())) {
      setOptions(EMPTY_OPTIONS);
      return;
    }

    let cancelled = false;
    setLoading(true);
    ordersApi
      .fetchOrderTradeFacilityOptions({
        operatingShipperPartyId: operatingShipperPartyId.trim(),
        operatingConsigneePartyId: operatingConsigneePartyId.trim(),
      })
      .then((result) => {
        if (cancelled) return;
        setOptions(result);
      })
      .catch(() => {
        if (!cancelled) setOptions(EMPTY_OPTIONS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, operatingConsigneePartyId, operatingShipperPartyId]);

  const entityOptions = useMemo(() => {
    const out = {} as Record<TradeFacilitySlot, EntitySearchOption[]>;
    for (const slot of Object.keys(EMPTY_OPTIONS) as TradeFacilitySlot[]) {
      out[slot] = options[slot].map(toEntityOption);
    }
    return out;
  }, [options]);

  const searchBySlot = useMemo(() => {
    const build = (slot: TradeFacilitySlot) => async (query: string) => {
      const q = query.trim().toLowerCase();
      const rows = entityOptions[slot];
      if (!q) return rows.slice(0, 50);
      return rows
        .filter(
          (row) =>
            row.label.toLowerCase().includes(q) ||
            String(row.meta ?? "")
              .toLowerCase()
              .includes(q)
        )
        .slice(0, 50);
    };

    return {
      placeOfReceipt: build("placeOfReceipt"),
      portOfLoading: build("portOfLoading"),
      portOfDischarge: build("portOfDischarge"),
      placeOfDelivery: build("placeOfDelivery"),
    };
  }, [entityOptions]);

  const labelForSlot = useCallback(
    (slot: TradeFacilitySlot, facilityId: string) => {
      const match = options[slot].find((row) => row.facilityId === facilityId);
      return match ? facilityLabel(match) : "";
    },
    [options]
  );

  useEffect(() => {
    if (!enabled || !onAutoSelect) return;
    const patch: Partial<OrderLocationFacilityIds> = {};

    for (const slot of Object.keys(EMPTY_OPTIONS) as TradeFacilitySlot[]) {
      const idField = SLOT_ID_FIELD[slot];
      const current = String(selection[idField] ?? "").trim();
      const slotOptions = options[slot];
      if (current || slotOptions.length !== 1) continue;
      const only = slotOptions[0];
      patch[idField] = only.facilityId;
      patch[SLOT_TEXT_FIELD[slot] as keyof OrderLocationFacilityIds] = only.locationCode;
    }

    if (Object.keys(patch).length > 0) {
      onAutoSelect(patch);
    }
  }, [enabled, onAutoSelect, options, selection]);

  useEffect(() => {
    if (!enabled || !onAutoSelect || !chainDefaults) return;
    const patch: Partial<OrderLocationFacilityIds> = {};

    const portPairs: Array<[TradeFacilitySlot, string]> = [
      ["portOfLoading", chainDefaults.portOfLoading],
      ["portOfDischarge", chainDefaults.portOfDischarge],
    ];

    for (const [slot, locationCode] of portPairs) {
      const idField = SLOT_ID_FIELD[slot];
      if (String(selection[idField] ?? "").trim()) continue;
      const code = locationCode.trim().toUpperCase();
      if (!code) continue;
      const match =
        options[slot].find((row) => row.locationCode.toUpperCase() === code) ??
        options[slot].find((row) => row.code.toUpperCase() === code);
      if (!match) continue;
      patch[idField] = match.facilityId;
      patch[SLOT_TEXT_FIELD[slot] as keyof OrderLocationFacilityIds] = match.locationCode || code;
    }

    if (Object.keys(patch).length > 0) {
      onAutoSelect(patch);
    }
  }, [chainDefaults, enabled, onAutoSelect, options, selection]);

  return {
    loading,
    options,
    searchBySlot,
    labelForSlot,
  };
}

export { SLOT_ID_FIELD, SLOT_TEXT_FIELD };
