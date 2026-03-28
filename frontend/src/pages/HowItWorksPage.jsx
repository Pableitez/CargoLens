import { Link, NavLink, Navigate, useParams } from "react-router-dom";
import { BackLink } from "../components/BackLink.jsx";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { DASHBOARD_OVERVIEW_PATH } from "../config/paths.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

const VALID_SECTIONS = new Set(["track", "vessels", "workspace", "list", "import", "clients", "activity"]);

const SECTIONS = [
  { slug: "track", titleKey: "secTrackTitle", bodyKey: "secTrackBody", navKey: "navTrack" },
  { slug: "vessels", titleKey: "secVesselsTitle", bodyKey: "secVesselsBody", navKey: "navVessels" },
  { slug: "workspace", titleKey: "secWorkspaceTitle", bodyKey: "secWorkspaceBody", navKey: "navWorkspace" },
  { slug: "list", titleKey: "secListTitle", bodyKey: "secListBody", navKey: "navList" },
  { slug: "import", titleKey: "secImportTitle", bodyKey: "secImportBody", navKey: "navImport" },
  { slug: "clients", titleKey: "secClientsTitle", bodyKey: "secClientsBody", navKey: "navClients" },
  { slug: "activity", titleKey: "secActivityTitle", bodyKey: "secActivityBody", navKey: "navActivity" },
];

// Guía por sección: /how-it-works/:section (tabs, sin página infinita).
export function HowItWorksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { section } = useParams();

  if (!section || !VALID_SECTIONS.has(section)) {
    return <Navigate to="/how-it-works/track" replace />;
  }

  const meta = SECTIONS.find((s) => s.slug === section);
  const isTrack = section === "track";

  return (
    <MainLayout title={t(`howItWorks.pageTitle.${section}`)}>
      <div className="how-it-works">
        <BackLink className="how-it-works__back" />
        <nav className="how-it-works__tabs" aria-label={t("howItWorks.tocAria")}>
          <ul className="how-it-works__tabs-list">
            {SECTIONS.map(({ slug, navKey }) => (
              <li key={slug}>
                <NavLink
                  to={`/how-it-works/${slug}`}
                  className={({ isActive }) =>
                    `how-it-works__tab${isActive ? " how-it-works__tab--active" : ""}`
                  }
                  end
                >
                  {t(`howItWorks.${navKey}`)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {isTrack ? (
          <section className="home-guest-promo how-it-works__intro" aria-label={t("howItWorks.title")}>
            <div className="home-guest-promo__inner">
              <div className="home-guest-promo__text">
                <p className="how-it-works__eyebrow">{t("howItWorks.eyebrow")}</p>
                <p className="home-guest-promo__lead">{t("howItWorks.lead")}</p>
                <ol className="how-it-works__steps">
                  <li className="how-it-works__step">
                    <span className="how-it-works__num" aria-hidden>
                      1
                    </span>
                    <div>
                      <h3 className="how-it-works__step-title">{t("howItWorks.step1Title")}</h3>
                      <p className="how-it-works__step-body">{t("howItWorks.step1Body")}</p>
                    </div>
                  </li>
                  <li className="how-it-works__step">
                    <span className="how-it-works__num" aria-hidden>
                      2
                    </span>
                    <div>
                      <h3 className="how-it-works__step-title">{t("howItWorks.step2Title")}</h3>
                      <p className="how-it-works__step-body">{t("howItWorks.step2Body")}</p>
                    </div>
                  </li>
                  <li className="how-it-works__step">
                    <span className="how-it-works__num" aria-hidden>
                      3
                    </span>
                    <div>
                      <h3 className="how-it-works__step-title">{t("howItWorks.step3Title")}</h3>
                      <p className="how-it-works__step-body">{t("howItWorks.step3Body")}</p>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="home-guest-promo__visual home-guest-promo__visual--photo">
                <img
                  className="home-guest-promo__img"
                  src="/images/how-it-works-hero.png"
                  alt={t("howItWorks.imageAlt")}
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </section>
        ) : null}

        {!isTrack ? (
          <article className="how-it-works__single">
            <h2 className="how-it-works__section-title">{t(`howItWorks.${meta.titleKey}`)}</h2>
            <p className="how-it-works__section-body">{t(`howItWorks.${meta.bodyKey}`)}</p>
          </article>
        ) : null}

        <div className="how-it-works__cta-row">
          <Link to="/" className="btn btn--primary">
            {t("howItWorks.ctaTrack")}
          </Link>
          {user ? (
            <Link to={DASHBOARD_OVERVIEW_PATH} className="btn btn--secondary">
              {t("howItWorks.ctaDashboard")}
            </Link>
          ) : (
            <Link to="/register" className="btn btn--secondary">
              {t("howItWorks.ctaRegister")}
            </Link>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
