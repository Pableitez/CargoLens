import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as shipmentsApi from "../api/shipments";
import { BrandMark } from "../components/BrandMark.jsx";
import { appName } from "../config/siteMeta.js";
import { useAppTranslation } from "../i18n/useAppTranslation";
import { ShipmentTimeline } from "../features/shipments/ShipmentTimeline";
import { formatShipmentDate, shipmentStatusLabel } from "../features/shipments/shipmentUtils";
import type { PublicShipment } from "../features/shipments/types";

export function PublicShipmentPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useAppTranslation();
  const [item, setItem] = useState<PublicShipment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    shipmentsApi
      .fetchPublicShipment(token)
      .then(setItem)
      .catch(() => setError(t("publicShipment.loadFailed")))
      .finally(() => setLoading(false));
  }, [token, t]);

  return (
    <main className="public-share">
      <header className="public-share__header">
        <Link to="/" className="public-share__brand">
          <BrandMark className="" size={32} />
          <span>{appName}</span>
        </Link>
      </header>

      <section className="panel panel--public-share">
        {loading && <p className="panel__muted">{t("publicShipment.loading")}</p>}
        {error && (
          <p className="panel__error" role="alert">
            {error}
          </p>
        )}
        {item && (
          <>
            <p className="panel__eyebrow">{t("publicShipment.eyebrow")}</p>
            <h1 className="panel__title">{item.reference}</h1>
            {item.companyName && <p className="panel__lead">{item.companyName}</p>}

            <dl className="public-share__meta">
              <div>
                <dt>{t("publicShipment.route")}</dt>
                <dd>
                  {item.origin || "—"} → {item.destination || "—"}
                </dd>
              </div>
              <div>
                <dt>{t("publicShipment.eta")}</dt>
                <dd>{formatShipmentDate(item.eta)}</dd>
              </div>
              <div>
                <dt>{t("publicShipment.status")}</dt>
                <dd>{shipmentStatusLabel(item.status, t)}</dd>
              </div>
              <div>
                <dt>{t("publicShipment.updated")}</dt>
                <dd>{formatShipmentDate(item.updatedAt)}</dd>
              </div>
            </dl>

            {item.containers.length > 0 && (
              <>
                <h2 className="panel__subhead">{t("publicShipment.containers")}</h2>
                <ul className="public-share__containers">
                  {item.containers.map((c) => (
                    <li key={c.containerNumber}>
                      <code>{c.containerNumber}</code>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {(item.events?.length ?? 0) > 0 && (
              <>
                <h2 className="panel__subhead">{t("publicShipment.timeline")}</h2>
                <ShipmentTimeline events={item.events ?? []} emptyLabel={t("publicShipment.timelineEmpty")} />
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
