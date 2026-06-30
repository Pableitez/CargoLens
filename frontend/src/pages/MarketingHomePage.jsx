import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark.jsx";
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

const EXPLORE_LINKS = [
  { to: "/how-it-works/workspace", titleKey: "howItWorks", descKey: "howItWorksDesc" },
  { to: "/changelog", titleKey: "changelog", descKey: "changelogDesc" },
];

const HERO_STATS = [
  { valueKey: "statModulesValue", labelKey: "statModulesLabel" },
  { valueKey: "statFlowValue", labelKey: "statFlowLabel" },
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
              <h1 className="hero__headline">{t("marketing.hero.title")}</h1>
              <p className="hero__sub hero__sub--pitch">{t("marketing.hero.lead")}</p>
              <div className="hero__cta-row">
                <Link to="/register" className="btn btn--primary btn--lg">
                  {t("marketing.hero.ctaPrimary")}
                </Link>
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
          <blockquote className="marketing-brand-story">
            <p>
              {t("marketing.story.line1Lead")} <strong>{appName}</strong> {t("marketing.story.line1Tail")}
            </p>
            <p>
              <strong>{appName}</strong> {t("marketing.story.line2Tail")}
            </p>
          </blockquote>
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

        <RevealOnScroll
          className="home-landing__panel home-landing__panel--narrow breakout marketing-contact"
          delayMs={70}
        >
          <div className="breakout__glow" aria-hidden />
          <h2 className="home-landing__h home-landing__h--center">{t("marketing.cta.title")}</h2>
          <p className="home-landing__lead home-landing__lead--center">{t("marketing.cta.lead")}</p>
          <div className="hero__cta-row home-guest-promo__actions">
            <Link to="/register" className="btn btn--primary btn--lg">
              {t("marketing.cta.primary")}
            </Link>
            <Link to="/how-it-works/workspace" className="btn btn--secondary btn--lg">
              {t("marketing.cta.secondary")}
            </Link>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="home-landing__panel breakout marketing-explore" delayMs={80}>
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
