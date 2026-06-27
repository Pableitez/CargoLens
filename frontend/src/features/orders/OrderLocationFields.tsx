import { EntitySearchPicker } from "../../components/EntitySearchPicker";
import { LocationCombobox } from "../../components/LocationCombobox";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  type OrderLocationFacilityIds,
  type TradeFacilitySlot,
  useOrderTradeFacilities,
} from "./useOrderTradeFacilities";
import type { OrderChainDefaults } from "./useOrderTradeSetup";

type OrderLocationFieldsProps = {
  usesTradeMasters: boolean;
  operatingShipperPartyId: string;
  operatingConsigneePartyId: string;
  value: OrderLocationFacilityIds;
  onChange: (patch: Partial<OrderLocationFacilityIds>) => void;
  chainDefaults?: OrderChainDefaults | null;
  disabled?: boolean;
};

const SLOTS: Array<{
  slot: TradeFacilitySlot;
  labelKey: string;
  requiresParty: "shipper" | "consignee" | "either";
}> = [
  { slot: "placeOfReceipt", labelKey: "ordersPage.placeOfReceiptLabel", requiresParty: "shipper" },
  { slot: "portOfLoading", labelKey: "ordersPage.portOfLoadingLabel", requiresParty: "shipper" },
  { slot: "portOfDischarge", labelKey: "ordersPage.portOfDischargeLabel", requiresParty: "consignee" },
  { slot: "placeOfDelivery", labelKey: "ordersPage.placeOfDeliveryLabel", requiresParty: "consignee" },
];

const ID_FIELDS: Record<TradeFacilitySlot, keyof OrderLocationFacilityIds> = {
  placeOfReceipt: "placeOfReceiptFacilityId",
  portOfLoading: "portOfLoadingFacilityId",
  portOfDischarge: "portOfDischargeFacilityId",
  placeOfDelivery: "placeOfDeliveryFacilityId",
};

export function OrderLocationFields({
  usesTradeMasters,
  operatingShipperPartyId,
  operatingConsigneePartyId,
  value,
  onChange,
  chainDefaults,
  disabled = false,
}: OrderLocationFieldsProps) {
  const { t } = useAppTranslation();

  const { loading, options, searchBySlot, labelForSlot } = useOrderTradeFacilities({
    enabled: usesTradeMasters,
    operatingShipperPartyId,
    operatingConsigneePartyId,
    selection: value,
    onAutoSelect: onChange,
    chainDefaults,
  });

  if (!usesTradeMasters) {
    return (
      <>
        {SLOTS.map(({ slot, labelKey }) => (
          <div className="field" key={slot}>
            <label className="field__label" htmlFor={`order-${slot}`}>
              {t(labelKey)}
            </label>
            <LocationCombobox
              id={`order-${slot}`}
              value={value[slot]}
              onChange={(code) => onChange({ [slot]: code })}
            />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {SLOTS.map(({ slot, labelKey, requiresParty }) => {
        const idField = ID_FIELDS[slot];
        const partyReady =
          requiresParty === "shipper"
            ? Boolean(operatingShipperPartyId.trim())
            : requiresParty === "consignee"
              ? Boolean(operatingConsigneePartyId.trim())
              : Boolean(operatingShipperPartyId.trim() || operatingConsigneePartyId.trim());
        const slotOptions = options[slot];
        const facilityId = String(value[idField] ?? "");

        return (
          <div className="field" key={slot}>
            <label className="field__label" htmlFor={`order-${slot}`}>
              {t(labelKey)}
            </label>
            <EntitySearchPicker
              key={`${slot}-${operatingShipperPartyId}-${operatingConsigneePartyId}`}
              id={`order-${slot}`}
              value={facilityId}
              valueLabel={labelForSlot(slot, facilityId)}
              onChange={(nextId) => {
                const match = slotOptions.find((row) => row.facilityId === nextId);
                onChange({
                  [idField]: nextId,
                  [slot]: match?.locationCode ?? "",
                });
              }}
              onSearch={searchBySlot[slot]}
              disabled={disabled || loading || !partyReady}
              minQueryLength={0}
              hideTypeHint
              placeholder={t("tradeField.facilityPlaceholder")}
              emptyMessage={
                !partyReady
                  ? t("tradeField.selectPartyFirst", {
                      role: requiresParty === "shipper" ? t("tradeField.shipper") : t("tradeField.consignee"),
                    })
                  : slotOptions.length === 0
                    ? t("tradeField.noLinkedFacilities")
                    : t("tradeField.noSearchMatch")
              }
            />
          </div>
        );
      })}
    </>
  );
}

export type { OrderLocationFacilityIds };
