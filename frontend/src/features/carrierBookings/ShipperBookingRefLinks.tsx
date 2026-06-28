import { Fragment } from "react";
import { Link } from "react-router-dom";
import { SHIPPER_BOOKING_BASE, shipperBookingLinksFromCarrierRow } from "./carrierBookingUtils";
import type { CarrierBookingRequest } from "./types";

export function ShipperBookingRefLinks({ row }: { row: CarrierBookingRequest }) {
  const links = shipperBookingLinksFromCarrierRow(row);

  if (links.length === 0) return <>—</>;

  return (
    <>
      {links.map((item, index) => (
        <Fragment key={item.id || item.ref}>
          {index > 0 ? ", " : null}
          {item.id ? (
            <Link to={`${SHIPPER_BOOKING_BASE}/${item.id}`} className="dash-table__link order-code">
              {item.ref}
            </Link>
          ) : (
            <span className="order-code">{item.ref}</span>
          )}
        </Fragment>
      ))}
    </>
  );
}
