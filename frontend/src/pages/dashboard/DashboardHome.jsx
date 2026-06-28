import { Link } from "react-router-dom";
import { SidebarNavIcon } from "../../components/sidebarNavIcons.tsx";
import { useTranslation } from "../../i18n/LanguageContext.jsx";
import { useDashboardWorkspace } from "./DashboardWorkspaceContext.jsx";

const STAFF_QUICK_LINKS = [
  {
    id: "operations",
    route: "/dashboard/operations",
    titleKey: "dashboardHome.quickOperations",
    descKey: "dashboardHome.quickOperationsDesc",
    moduleId: "operations",
    primary: true,
  },
  {
    id: "orders",
    route: "/dashboard/operations/export/order",
    titleKey: "dashboardHome.quickOrders",
    descKey: "dashboardHome.quickOrdersDesc",
    moduleId: "order",
    primary: true,
  },
  {
    id: "bookings",
    route: "/dashboard/operations/export/shipper-booking",
    titleKey: "dashboardHome.quickBookings",
    descKey: "dashboardHome.quickBookingsDesc",
    moduleId: "shipperBooking",
    primary: true,
  },
  {
    id: "carrierBookings",
    route: "/dashboard/operations/transport/carrier-booking",
    titleKey: "dashboardHome.quickCarrierBookings",
    descKey: "dashboardHome.quickCarrierBookingsDesc",
    moduleId: "carrierBooking",
    primary: true,
  },
  {
    id: "tradeSetup",
    route: "/dashboard/clients/parties",
    titleKey: "dashboardHome.quickTradeSetup",
    descKey: "dashboardHome.quickTradeSetupDesc",
    moduleId: "parties",
  },
];

const PORTAL_QUICK_LINKS = [
  {
    id: "tradeSetup",
    route: "/dashboard/trade-setup",
    titleKey: "dashboardHome.quickTradeSetupPortal",
    descKey: "dashboardHome.quickTradeSetupPortalDesc",
    moduleId: "tradeSetupPortal",
    primary: true,
  },
  {
    id: "messages",
    route: "/dashboard/messages",
    titleKey: "dashboardHome.quickMessages",
    descKey: "dashboardHome.quickMessagesDesc",
    moduleId: "messages",
  },
];

function QuickLinkCard({ link, t }) {
  const cardClass = [
    "module-hub-card",
    link.muted ? "module-hub-card--muted" : "",
    link.primary ? "module-hub-card--primary" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={cardClass}>
      <Link to={link.route} className="module-hub-card__link">
        <div className="module-hub-card__head">
          <span className="module-hub-card__icon" aria-hidden>
            <SidebarNavIcon moduleId={link.moduleId} className="module-hub-card__svg" />
          </span>
          <div className="module-hub-card__text">
            <span className="module-hub-card__title">{t(link.titleKey)}</span>
            <span className="dash-home__card-desc">{t(link.descKey)}</span>
          </div>
        </div>
        <div className="module-hub-card__foot">
          <span className="module-hub-card__badge module-hub-card__badge--live">
            {t("modules.statusLive")}
          </span>
          <span className="module-hub-card__cta">{t("dashboardHome.openLink")} →</span>
        </div>
      </Link>
    </li>
  );
}

export function DashboardHome() {
  const { t } = useTranslation();
  const { isClientPortal, user } = useDashboardWorkspace();

  const displayName = isClientPortal
    ? user?.clientName || t("sidebar.clientPortalFallback")
    : user?.companyName || t("sidebar.companyFallback");

  const title = isClientPortal ? t("dashboardHome.titlePortal") : t("dashboardHome.title");
  const lead = isClientPortal ? t("dashboardHome.leadPortal") : t("dashboardHome.lead");
  const links = isClientPortal ? PORTAL_QUICK_LINKS : STAFF_QUICK_LINKS;

  return (
    <section
      className="panel panel--dash-form panel--module-hub panel--module-hub--operations dash-home"
      aria-labelledby="dash-home-heading"
    >
      <div className="module-hub__hero dash-home__hero">
        <p className="dash-home__eyebrow">{t("dashboardHome.quickStartTitle")}</p>
        <h1 id="dash-home-heading" className="panel__title panel__title--section">
          {t("dashboardHome.welcome", { name: displayName })}
        </h1>
        <p className="panel__lead">{lead}</p>
        <p className="module-hub__hint">
          {isClientPortal ? t("dashboardHome.hintPortal") : t("dashboardHome.hintStaff")}
        </p>
      </div>

      <h2 className="dash-home__section-title">{title}</h2>
      <ul className="module-hub-grid">
        {links.map((link) => (
          <QuickLinkCard key={link.id} link={link} t={t} />
        ))}
      </ul>
    </section>
  );
}
