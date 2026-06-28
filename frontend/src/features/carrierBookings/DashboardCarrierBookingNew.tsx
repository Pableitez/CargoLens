import { Link } from "react-router-dom";
import { PageBreadcrumb } from "../../components/PageBreadcrumb.jsx";
import { SidebarNavIcon } from "../../components/sidebarNavIcons";
import { useAppTranslation } from "../../i18n/useAppTranslation";

const CARRIER_BOOKING_BASE = "/dashboard/operations/transport/carrier-booking";
const TRANSPORT_HUB = "/dashboard/operations/transport";

const CREATE_OPTIONS = [
  {
    id: "manual",
    route: `${CARRIER_BOOKING_BASE}/new/manual`,
    moduleId: "carrierBooking",
    titleKey: "carrierBookingsPage.createManualTitle",
    primary: true,
  },
  {
    id: "from-sb",
    route: `${CARRIER_BOOKING_BASE}/new/from-sb`,
    moduleId: "shipperBooking",
    titleKey: "carrierBookingsPage.createFromSbTitle",
    primary: false,
  },
] as const;

export function DashboardCarrierBookingNew() {
  const { t } = useAppTranslation();

  return (
    <section
      className="panel panel--dash-form panel--module-hub panel--orders"
      aria-labelledby="carrier-booking-new-heading"
    >
      <PageBreadcrumb
        items={[
          { label: t("modules.nav.home"), to: "/dashboard/home" },
          { label: t("modules.transport.title"), to: TRANSPORT_HUB },
          { label: t("modules.transport.carrierBooking"), to: CARRIER_BOOKING_BASE },
          { label: t("carrierBookingsPage.createHubTitle") },
        ]}
      />

      <h1 id="carrier-booking-new-heading" className="panel__title panel__title--section">
        {t("carrierBookingsPage.createHubTitle")}
      </h1>

      <ul className="module-hub-grid">
        {CREATE_OPTIONS.map((option) => {
          const cardClass = ["module-hub-card", option.primary ? "module-hub-card--primary" : ""]
            .filter(Boolean)
            .join(" ");

          return (
            <li key={option.id} className={cardClass}>
              <Link to={option.route} className="module-hub-card__link">
                <div className="module-hub-card__head">
                  <span className="module-hub-card__icon" aria-hidden>
                    <SidebarNavIcon moduleId={option.moduleId} className="module-hub-card__svg" />
                  </span>
                  <div className="module-hub-card__text">
                    <span className="module-hub-card__title">{t(option.titleKey)}</span>
                  </div>
                </div>
                <div className="module-hub-card__foot">
                  <span className="module-hub-card__cta">{t("carrierBookingsPage.createOptionCta")} →</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
