import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { messageFromApiErrorOrKey } from "../i18n/apiMessage.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyInviteCode, setCompanyInviteCode] = useState("");
  const [clientInviteCode, setClientInviteCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const joinCompanyMode = companyInviteCode.trim().length > 0;
  const joinClientMode = clientInviteCode.trim().length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (joinCompanyMode && joinClientMode) {
      setError(t("auth.errBothInvites"));
      return;
    }
    if (!joinCompanyMode && !joinClientMode && !companyName.trim()) {
      setError(t("auth.errCompanyOrInvite"));
      return;
    }
    setSubmitting(true);
    try {
      const body = { email, password };
      if (joinClientMode) {
        body.clientInviteCode = clientInviteCode.trim().toUpperCase();
      } else if (joinCompanyMode) {
        body.companyInviteCode = companyInviteCode.trim().toUpperCase();
      } else {
        body.companyName = companyName.trim();
      }
      await register(body);
      navigate("/dashboard/overview", { replace: true });
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "auth.registerFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MainLayout dataSource={null}>
      <div className="auth-page auth-page--centered">
        <div className="auth-card auth-card--wide auth-card--comfort">
          <p className="auth-card__eyebrow">{t("auth.registerEyebrow")}</p>
          <h1 className="auth-card__title">{t("auth.registerTitle")}</h1>
          <p className="auth-card__lead auth-card__lead--stacked">
            <span className="auth-card__lead-line">{t("auth.registerLead1")}</span>
            <span className="auth-card__lead-line">{t("auth.registerLead2")}</span>
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label" htmlFor="reg-email">
                {t("auth.email")}
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field__input"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="reg-password">
                {t("auth.passwordLabel")} <span className="field__hint">{t("auth.passwordHint")}</span>
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="field__input"
              />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="reg-company">
                {t("auth.newCompanyName")}
              </label>
              <input
                id="reg-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={joinCompanyMode || joinClientMode}
                placeholder={t("auth.newCompanyPlaceholder")}
                className="field__input"
              />
            </div>

            <div className="auth-split">
              <div className="field">
                <label className="field__label" htmlFor="reg-invite-company">
                  {t("auth.companyInvite")}
                </label>
                <input
                  id="reg-invite-company"
                  type="text"
                  value={companyInviteCode}
                  onChange={(e) => setCompanyInviteCode(e.target.value.toUpperCase())}
                  disabled={joinClientMode}
                  placeholder={t("auth.companyInvitePlaceholder")}
                  className="field__input"
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="reg-invite-client">
                  {t("auth.clientInvite")}
                </label>
                <input
                  id="reg-invite-client"
                  type="text"
                  value={clientInviteCode}
                  onChange={(e) => setClientInviteCode(e.target.value.toUpperCase())}
                  disabled={joinCompanyMode}
                  placeholder={t("auth.clientInvitePlaceholder")}
                  className="field__input"
                  autoComplete="off"
                />
              </div>
            </div>
            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="btn btn--primary auth-submit" disabled={submitting}>
              {submitting ? t("auth.creating") : t("auth.createAccountBtn")}
            </button>
          </form>
          <p className="auth-footer">
            {t("auth.haveAccount")} <Link to="/login">{t("auth.signInLink")}</Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
