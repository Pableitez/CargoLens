import { FormEvent, useState } from "react";
import * as ordersApi from "../../api/orders";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import type { OrderBookableLine, OrderBookableSummary } from "../orders/types";
import { bookableLineToFormState } from "./bookFromOrdersUtils";
import type { ShipperBookingLineFormState } from "./types";
import { lineCompositeKey } from "./shipperBookingLineUtils";

type OrderLinesPickerProps = {
  excludeBookingId?: string;
  existingLineKeys: Set<string>;
  onAddLines: (lines: ShipperBookingLineFormState[]) => void;
  onPrefillFromOrder: (order: OrderBookableSummary) => void;
  embedded?: boolean;
};

export function OrderLinesPicker({
  excludeBookingId,
  existingLineKeys,
  onAddLines,
  onPrefillFromOrder,
  embedded = false,
}: OrderLinesPickerProps) {
  const { t } = useAppTranslation();
  const [orderNumber, setOrderNumber] = useState("");
  const [loadedOrderNumber, setLoadedOrderNumber] = useState("");
  const [loadedOrderExternalId, setLoadedOrderExternalId] = useState("");
  const [bookableLines, setBookableLines] = useState<OrderBookableLine[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLoad(e: FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const data = await ordersApi.fetchOrderBookableLines(trimmed, excludeBookingId);
      if (!data.order) {
        setBookableLines([]);
        setLoadedOrderNumber("");
        setLoadedOrderExternalId("");
        setError(t("shipperBookingsPage.orderLinesNotFound"));
        return;
      }
      setBookableLines(data.lines);
      setLoadedOrderNumber(data.order.orderNumber);
      setLoadedOrderExternalId(data.order.externalBusinessId);
      onPrefillFromOrder(data.order);
    } catch (err) {
      setBookableLines([]);
      setLoadedOrderNumber("");
      setLoadedOrderExternalId("");
      setError(messageFromApiErrorOrKey(err, t, "shipperBookingsPage.orderLinesLoadFailed"));
    } finally {
      setLoading(false);
    }
  }

  function toggleLine(lineKey: string, bookable: boolean) {
    if (!bookable) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(lineKey)) next.delete(lineKey);
      else next.add(lineKey);
      return next;
    });
  }

  function handleAddSelected() {
    if (!loadedOrderNumber || selected.size === 0) return;

    const toAdd: ShipperBookingLineFormState[] = [];
    for (const row of bookableLines) {
      if (!selected.has(row.lineKey) || !row.bookable) continue;
      const composite = lineCompositeKey(loadedOrderNumber, row.lineKey);
      if (existingLineKeys.has(composite)) continue;

      toAdd.push(bookableLineToFormState(loadedOrderNumber, row, loadedOrderExternalId));
    }

    if (toAdd.length === 0) return;
    onAddLines(toAdd);
    setSelected(new Set());
  }

  const selectableCount = bookableLines.filter(
    (row) => row.bookable && !existingLineKeys.has(lineCompositeKey(loadedOrderNumber, row.lineKey))
  ).length;

  return (
    <div className={embedded ? "order-lines-picker order-lines-picker--embedded" : "order-lines-picker"}>
      {!embedded && (
        <h4 className="order-lines-picker__title">{t("shipperBookingsPage.bookFromOrderTitle")}</h4>
      )}

      <form className="order-lines-picker__search" onSubmit={handleLoad}>
        <div className="field">
          <label className="field__label" htmlFor="pick-order-number">
            {t("shipperBookingsPage.pickOrderNumberLabel")}
          </label>
          <input
            id="pick-order-number"
            className="field__input order-code"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ORD-2026-001"
          />
        </div>
        <button type="submit" className="btn btn--ghost" disabled={loading || !orderNumber.trim()}>
          {loading ? t("shipperBookingsPage.loadingOrderLines") : t("shipperBookingsPage.loadOrderLines")}
        </button>
      </form>

      {error && (
        <p className="panel__error" role="alert">
          {error}
        </p>
      )}

      {bookableLines.length > 0 && (
        <>
          <div className="dash-table-wrap dash-table-wrap--mt">
            <table className="dash-table order-lines-picker__table">
              <thead>
                <tr>
                  <th scope="col" aria-label={t("shipperBookingsPage.pickLineLabel")} />
                  <th scope="col">{t("shipperBookingsPage.lineKeyLabel")}</th>
                  <th scope="col">{t("shipperBookingsPage.skuLabel")}</th>
                  <th scope="col">{t("shipperBookingsPage.orderedQtyLabel")}</th>
                  <th scope="col">{t("shipperBookingsPage.alreadyBookedLabel")}</th>
                  <th scope="col">{t("shipperBookingsPage.remainingLabel")}</th>
                  <th scope="col">{t("shipperBookingsPage.lineStatusLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {bookableLines.map((row) => {
                  const composite = lineCompositeKey(loadedOrderNumber, row.lineKey);
                  const alreadyAdded = existingLineKeys.has(composite);
                  const disabled = !row.bookable || alreadyAdded;

                  return (
                    <tr
                      key={row.lineKey}
                      className={disabled ? "order-lines-picker__row--disabled" : undefined}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.has(row.lineKey)}
                          disabled={disabled}
                          onChange={() => toggleLine(row.lineKey, row.bookable && !alreadyAdded)}
                          aria-label={t("shipperBookingsPage.pickLineLabel")}
                        />
                      </td>
                      <td>{row.lineKey}</td>
                      <td>{row.sku}</td>
                      <td>
                        {row.orderedQuantity} {row.uom}
                      </td>
                      <td>{row.bookedQuantity}</td>
                      <td>{row.remainingQuantity}</td>
                      <td>
                        {alreadyAdded
                          ? t("shipperBookingsPage.lineAlreadyInBooking")
                          : row.fullyBooked
                            ? t("shipperBookingsPage.lineFullyBooked")
                            : t("shipperBookingsPage.lineAvailable")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="order-lines__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={selected.size === 0 || selectableCount === 0}
              onClick={() => handleAddSelected()}
            >
              {t("shipperBookingsPage.addSelectedLines", { count: selected.size })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
