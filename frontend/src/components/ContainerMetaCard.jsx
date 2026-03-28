import { useTranslation } from "../i18n/LanguageContext.jsx";

export function ContainerMetaCard({ data }) {
  const { t } = useTranslation();
  const c = data.container ?? {};
  const rows = [
    { k: t("components.containerMeta.isoType"), v: c.isoCode },
    { k: t("components.containerMeta.sizeType"), v: c.sizeType },
    { k: t("components.containerMeta.containerStatus"), v: c.status ?? data.rawShippingStatus },
    { k: t("components.containerMeta.shipmentType"), v: data.shipmentType },
    { k: t("components.containerMeta.scacPrefix"), v: data.carrier?.scac },
  ].filter((r) => r.v != null && String(r.v).trim() !== "");

  return (
    <div className="info-card">
      <h3 className="info-card__title">{t("components.containerMeta.title")}</h3>
      <dl className="info-card__grid">
        {rows.map((r) => (
          <div key={r.k} className="info-card__cell">
            <dt>{r.k}</dt>
            <dd>{r.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
