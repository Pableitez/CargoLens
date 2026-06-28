import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark.jsx";
import { PilotLeadForm } from "../components/PilotLeadForm.jsx";
import { RevealOnScroll } from "../components/RevealOnScroll.jsx";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { appName } from "../config/siteMeta.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

const FLOW_STEPS = [
  { id: "order", live: true },
  { id: "shipperBooking", live: true },
  { id: "carrierBooking", live: true },
  { id: "portal", live: false },
  { id: "tradeSetup", live: true },
];

const LIVE_MODULES = ["order", "shipperBooking", "carrierBooking", "tradeSetup"];

const WHY_STEPS = ["step1", "step2", "step3"];

const PRICING_PLANS = ["pilot", "starter", "growth"];

const EXPLORE_LINKS = [
  { to: "/how-it-works/workspace", titleKey: "howItWorks", descKey: "howItWorksDesc" },
  { to: "/changelog", titleKey: "changelog", descKey: "changelogDesc" },
];

const TRUST_ITEMS = ["item1", "item2", "item3"];

const HERO_STATS = [
  { valueKey: "statModulesValue", labelKey: "statModulesLabel" },
  { valueKey: "statOnboardingValue", labelKey: "statOnboardingLabel" },
  { valueKey: "statPricingValue", labelKey: "statPricingLabel" },
];

export function MarketingHomePage() {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="marketing-page" aria-label={t("marketing.aria")}>
        <section className="marketing-hero hero hero--elevated breakout">
          <div className="breakout__glow" aria-hidden />
          <div className="marketing-hero__grid">
            <div className="marketing-hero__copy">
              <div className="hero__brand">
                <BrandMark size={32} />
                <p className="hero__eyebrow">{appName}</p>
              </div>
              <p className="marketing-hero__launch-badge">{t("marketing.hero.launchBadge")}</p>
              <h1 className="hero__headline">{t("marketing.hero.title")}</h1>
              <p className="hero__sub hero__sub--pitch">{t("marketing.hero.lead")}</p>
              <div className="hero__cta-row">
                <a href="#pilot-form" className="btn btn--primary btn--lg">
                  {t("marketing.hero.ctaPrimary")}
                </a>
                <Link to="/login" className="btn btn--secondary btn--lg">
                  {t("marketing.hero.ctaSecondary")}
                </Link>
              </div>
              <Link to="/how-it-works/workspace" className="marketing-hero__track-link">
                {t("marketing.hero.ctaGuide")} →
              </Link>
              <ul className="marketing-hero__stats">
                {HERO_STATS.map(({ valueKey, labelKey }) => (
                  <li key={valueKey} className="marketing-hero__stat">
                    <span className="marketing-hero__stat-value">{t(`marketing.hero.${valueKey}`)}</span>
                    <span className="marketing-hero__stat-label">{t(`marketing.hero.${labelKey}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="marketing-hero__visual marketing-hero__visual--framed">
              <div className="marketing-hero__visual-glow" aria-hidden />
              <div className="marketing-hero__browser">
                <div className="marketing-hero__browser-bar" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
                <img
                  src="/images/home-value-workspace.png"
                  alt={t("marketing.hero.imageAlt")}
                  className="marketing-hero__img"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>

        <RevealOnScroll className="home-landing__panel home-landing__panel--narrow breakout" delayMs={40}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h home-landing__h--center">{t("marketing.statement.title")}</h2>
          <p className="home-landing__lead home-landing__lead--center">{t("marketing.statement.lead")}</p>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel home-landing__panel--narrow breakout" delayMs={45}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h home-landing__h--center">{t("marketing.trust.title")}</h2>
          <ul className="marketing-benefits marketing-benefits--trust">
            {TRUST_ITEMS.map((id) => (
              <li key={id} className="marketing-benefits__item">
                <p className="marketing-benefits__body">{t(`marketing.trust.${id}`)}</p>
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout" delayMs={50}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.flow.title")}</h2>
          <p className="home-landing__lead">{t("marketing.flow.lead")}</p>
          <ol className="marketing-flow">
            {FLOW_STEPS.map(({ id, live }) => (
              <li key={id} className="marketing-flow__step">
                <span className="marketing-flow__badge" data-live={live ? "true" : undefined}>
                  {live ? t("marketing.flow.badgeLive") : t("marketing.flow.badgeSoon")}
                </span>
                <h3 className="marketing-flow__title">{t(`marketing.flow.${id}.title`)}</h3>
                <p className="marketing-flow__body">{t(`marketing.flow.${id}.body`)}</p>
              </li>
            ))}
          </ol>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout" delayMs={60}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.modules.title")}</h2>
          <p className="home-landing__lead">{t("marketing.modules.lead")}</p>
          <ul className="marketing-benefits">
            {LIVE_MODULES.map((id) => (
              <li key={id} className="marketing-benefits__item">
                <span className="marketing-benefits__badge" data-live="true">
                  {t("marketing.modules.badgeLive")}
                </span>
                <h3 className="marketing-benefits__title">{t(`marketing.modules.${id}.title`)}</h3>
                <p className="marketing-benefits__body">{t(`marketing.modules.${id}.body`)}</p>
              </li>
            ))}
          </ul>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout marketing-vision" delayMs={70}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h home-landing__h--center">{t("marketing.why.title")}</h2>
          <p className="home-landing__lead home-landing__lead--center">{t("marketing.why.lead")}</p>
          <ol className="marketing-value-loop__steps">
            {WHY_STEPS.map((id, index) => (
              <li key={id} className="marketing-value-loop__step">
                <span className="marketing-value-loop__index" aria-hidden>
                  {index + 1}
                </span>
                <h3 className="marketing-value-loop__title">{t(`marketing.why.${id}Title`)}</h3>
                <p className="marketing-value-loop__body">{t(`marketing.why.${id}Body`)}</p>
              </li>
            ))}
          </ol>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout" delayMs={80}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.pricing.title")}</h2>
          <p className="home-landing__lead">{t("marketing.pricing.lead")}</p>
          <ul className="marketing-benefits">
            {PRICING_PLANS.map((id) => (
              <li key={id} className="marketing-benefits__item marketing-pillar">
                <h3 className="marketing-benefits__title">
                  {t(`marketing.pricing.${id}.name`)}{" "}
                  <span className="marketing-pricing__price">
                    {t(`marketing.pricing.${id}.price`)}
                    <span className="marketing-pricing__period">{t(`marketing.pricing.${id}.period`)}</span>
                  </span>
                </h3>
                <p className="marketing-benefits__body">{t(`marketing.pricing.${id}.body`)}</p>
              </li>
            ))}
          </ul>
          <p className="marketing-platform__note">{t("marketing.pricing.note")}</p>
        </RevealOnScroll>

        <RevealOnScroll
          className="home-landing__panel home-landing__panel--narrow breakout marketing-contact"
          delayMs={90}
        >
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h home-landing__h--center">{t("marketing.cta.title")}</h2>
          <p className="home-landing__lead home-landing__lead--center">{t("marketing.cta.lead")}</p>
          <PilotLeadForm id="pilot-form" />
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout marketing-explore" delayMs={100}>
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h">{t("marketing.explore.title")}</h2>
          <ul className="marketing-explore__grid">
            {EXPLORE_LINKS.map(({ to, titleKey, descKey }) => (
              <li key={to}>
                <Link to={to} className="marketing-explore__card">
                  <span className="marketing-explore__card-title">{t(`marketing.explore.${titleKey}`)}</span>
                  <span className="marketing-explore__card-desc">{t(`marketing.explore.${descKey}`)}</span>
                  <span className="marketing-explore__card-arrow" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </RevealOnScroll>
      </div>
    </MainLayout>
  );
}
