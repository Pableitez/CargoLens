import { useEffect } from "react";
import { Link } from "react-router-dom";
import { EntitySearchPicker } from "../../components/EntitySearchPicker";
import { ReadOnlyFieldValue } from "../../components/ReadOnlyFieldValue";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import {
  EMPTY_ORDER_TRADE_SELECTION,
  useOrderTradeSetup,
  type OrderChainDefaults,
  type OrderTradeSelection,
} from "./useOrderTradeSetup";

type OrderTradeFieldsProps = {
  value: OrderTradeSelection;
  onChange: (patch: Partial<OrderTradeSelection>) => void;
  onChainDefaults?: (defaults: OrderChainDefaults) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

export function OrderTradeFields({
  value,
  onChange,
  onChainDefaults,
  disabled = false,
  readOnly = false,
}: OrderTradeFieldsProps) {
  const { t } = useAppTranslation();
  const {
    loadingClients,
    loadingPartyOptions,
    clients,
    shipperOptions,
    consigneeOptions,
    searchContractualCustomers,
    searchShippers,
    searchConsignees,
    selectedCustomerLabel,
    selectedShipperLabel,
    selectedConsigneeLabel,
  } = useOrderTradeSetup({ enabled: true, selection: value, onChainDefaults });

  useEffect(() => {
    if (readOnly) return;
    if (shipperOptions.length === 1 && !value.operatingShipperPartyId.trim()) {
      onChange({ operatingShipperPartyId: shipperOptions[0].partyId });
    }
    if (consigneeOptions.length === 1 && !value.operatingConsigneePartyId.trim()) {
      onChange({ operatingConsigneePartyId: consigneeOptions[0].partyId });
    }
  }, [
    consigneeOptions,
    onChange,
    readOnly,
    shipperOptions,
    value.contractualPartyId,
    value.operatingConsigneePartyId,
    value.operatingShipperPartyId,
  ]);

  function handleClientChange(clientId: string) {
    onChange({
      contractualPartyId: clientId,
      supplyChainId: "",
      operatingShipperPartyId: "",
      operatingConsigneePartyId: "",
    });
  }

  const customerEmpty = !loadingClients && clients.length === 0;

  if (readOnly) {
    return (
      <>
        <div className="field order-trade-field">
          <span className="field__label">{t("tradeField.contractualCustomer")}</span>
          <ReadOnlyFieldValue>{selectedCustomerLabel}</ReadOnlyFieldValue>
        </div>
        <div className="field order-trade-field">
          <span className="field__label">{t("tradeField.shipper")}</span>
          <ReadOnlyFieldValue>{selectedShipperLabel}</ReadOnlyFieldValue>
        </div>
        <div className="field order-trade-field">
          <span className="field__label">{t("tradeField.consignee")}</span>
          <ReadOnlyFieldValue>{selectedConsigneeLabel}</ReadOnlyFieldValue>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="orders-note orders-note--trade">
        {t("tradeField.tradeSetupNote")}{" "}
        <Link to="/dashboard/clients/parties">{t("tradeField.tradeSetupLink")}</Link>
      </p>

      <div className="field order-trade-field">
        <label className="field__label" htmlFor="order-trade-client">
          {t("tradeField.contractualCustomer")} <span className="field__req">*</span>
        </label>
        <EntitySearchPicker
          id="order-trade-client"
          value={value.contractualPartyId}
          valueLabel={selectedCustomerLabel}
          onChange={handleClientChange}
          onSearch={searchContractualCustomers}
          disabled={disabled || loadingClients}
          minQueryLength={0}
          hideTypeHint
          placeholder={t("tradeField.searchCustomerPlaceholder")}
          emptyMessage={
            customerEmpty ? t("tradeField.noContractualCustomers") : t("tradeField.noSearchMatch")
          }
        />
      </div>

      <div className="field order-trade-field">
        <label className="field__label" htmlFor="order-trade-shipper">
          {t("tradeField.shipper")} <span className="field__req">*</span>
        </label>
        <EntitySearchPicker
          key={`order-shipper-${value.contractualPartyId}`}
          id="order-trade-shipper"
          value={value.operatingShipperPartyId}
          valueLabel={selectedShipperLabel}
          onChange={(partyId) => onChange({ operatingShipperPartyId: partyId })}
          onSearch={searchShippers}
          disabled={disabled || loadingPartyOptions || !value.contractualPartyId.trim()}
          minQueryLength={0}
          hideTypeHint
          placeholder={t("tradeField.shipperPlaceholder")}
          emptyMessage={
            !value.contractualPartyId.trim()
              ? t("tradeField.selectCustomerFirst")
              : t("tradeField.noRoleInRelationships", { role: t("tradeField.shipper") })
          }
        />
      </div>

      <div className="field order-trade-field">
        <label className="field__label" htmlFor="order-trade-consignee">
          {t("tradeField.consignee")} <span className="field__req">*</span>
        </label>
        <EntitySearchPicker
          key={`order-consignee-${value.contractualPartyId}`}
          id="order-trade-consignee"
          value={value.operatingConsigneePartyId}
          valueLabel={selectedConsigneeLabel}
          onChange={(partyId) => onChange({ operatingConsigneePartyId: partyId })}
          onSearch={searchConsignees}
          disabled={disabled || loadingPartyOptions || !value.contractualPartyId.trim()}
          minQueryLength={0}
          hideTypeHint
          placeholder={t("tradeField.consigneePlaceholder")}
          emptyMessage={
            !value.contractualPartyId.trim()
              ? t("tradeField.selectCustomerFirst")
              : t("tradeField.noRoleInRelationships", { role: t("tradeField.consignee") })
          }
        />
      </div>
    </>
  );
}

export { EMPTY_ORDER_TRADE_SELECTION, type OrderTradeSelection };
