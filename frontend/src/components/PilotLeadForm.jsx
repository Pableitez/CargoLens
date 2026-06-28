import { useState } from "react";
import { Link } from "react-router-dom";
import { submitPilotLead } from "../api/marketing.ts";
import { messageFromApiErrorOrKey } from "../i18n/apiMessage.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function PilotLeadForm({ id = "pilot-form" }) {
  const { t, locale } = useTranslation();
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const registerHref = `/register?${new URLSearchParams({
    email: email.trim(),
    company: companyName.trim(),
  }).toString()}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await submitPilotLead({
        email: email.trim(),
        companyName: companyName.trim(),
        name: contactName.trim() || undefined,
        locale,
        source: "landing",
      });
      setSubmitted(true);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "marketing.pilotForm.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="marketing-pilot-form marketing-pilot-form--success" id={id}>
        <h3 className="marketing-pilot-form__success-title">{t("marketing.pilotForm.successTitle")}</h3>
        <p className="marketing-pilot-form__success-lead">{t("marketing.pilotForm.successLead")}</p>
        <div className="hero__cta-row home-guest-promo__actions">
          <Link to={registerHref} className="btn btn--primary btn--lg">
            {t("marketing.pilotForm.continueRegister")}
          </Link>
          <Link to="/how-it-works/workspace" className="btn btn--secondary btn--lg">
            {t("marketing.pilotForm.secondary")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="marketing-pilot-form" id={id} onSubmit={handleSubmit}>
      <div className="marketing-pilot-form__grid">
        <div className="field">
          <label className="field__label" htmlFor="pilot-name">
            {t("marketing.pilotForm.nameLabel")}
          </label>
          <input
            id="pilot-name"
            type="text"
            autoComplete="name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={t("marketing.pilotForm.namePlaceholder")}
            className="field__input"
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="pilot-email">
            {t("marketing.pilotForm.emailLabel")}
          </label>
          <input
            id="pilot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field__input"
          />
        </div>
        <div className="field marketing-pilot-form__field--wide">
          <label className="field__label" htmlFor="pilot-company">
            {t("marketing.pilotForm.companyLabel")}
          </label>
          <input
            id="pilot-company"
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            minLength={2}
            placeholder={t("marketing.pilotForm.companyPlaceholder")}
            className="field__input"
          />
        </div>
      </div>
      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
      <div className="hero__cta-row home-guest-promo__actions">
        <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
          {submitting ? t("marketing.pilotForm.submitting") : t("marketing.pilotForm.submit")}
        </button>
        <Link to="/how-it-works/workspace" className="btn btn--secondary btn--lg">
          {t("marketing.pilotForm.secondary")}
        </Link>
      </div>
      <p className="marketing-pilot-form__skip">
        <Link to="/register">{t("marketing.pilotForm.skip")}</Link>
      </p>
    </form>
  );
}
