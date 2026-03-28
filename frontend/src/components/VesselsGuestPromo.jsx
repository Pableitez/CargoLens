import { Link } from "react-router-dom";
import { useTranslation } from "../i18n/LanguageContext.jsx";

// CTA en página buques si no hay sesión.
export function VesselsGuestPromo() {
  const { t } = useTranslation();

  return (
    <section className="home-guest-promo breakout" aria-labelledby="vessels-guest-promo-title">
      <div className="breakout__glow" aria-hidden />
      <div className="home-guest-promo__inner">
        <div className="home-guest-promo__text">
          <h2 id="vessels-guest-promo-title" className="home-guest-promo__title">
            {t("vesselsPage.guestPromo.title")}
          </h2>
          <p className="home-guest-promo__lead">{t("vesselsPage.guestPromo.lead")}</p>
          <ul className="home-guest-promo__features">
            <li className="home-guest-promo__feature">
              <span className="home-guest-promo__dot" aria-hidden />
              <span className="home-guest-promo__feature-text">{t("vesselsPage.guestPromo.f1")}</span>
            </li>
            <li className="home-guest-promo__feature">
              <span className="home-guest-promo__dot" aria-hidden />
              <span className="home-guest-promo__feature-text">{t("vesselsPage.guestPromo.f2")}</span>
            </li>
            <li className="home-guest-promo__feature">
              <span className="home-guest-promo__dot" aria-hidden />
              <span className="home-guest-promo__feature-text">{t("vesselsPage.guestPromo.f3")}</span>
            </li>
          </ul>
          <div className="home-guest-promo__actions">
            <Link to="/register" className="btn btn--primary">
              {t("vesselsPage.guestPromo.ctaRegister")}
            </Link>
            <Link to="/login" className="btn btn--secondary">
              {t("vesselsPage.guestPromo.ctaLogin")}
            </Link>
            <Link to="/how-it-works/vessels" className="btn btn--ghost home-guest-promo__how">
              {t("vesselsPage.guestPromo.howItWorks")}
            </Link>
          </div>
        </div>
        <div className="home-guest-promo__visual home-guest-promo__visual--photo">
          <img
            className="home-guest-promo__img"
            src="/images/container-guest-hero.png"
            alt={t("vesselsPage.guestPromo.imageAlt")}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
