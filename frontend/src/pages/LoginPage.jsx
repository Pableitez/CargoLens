import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { messageFromApiErrorOrKey } from "../i18n/apiMessage.js";
import { useTranslation } from "../i18n/LanguageContext.jsx";

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MainLayout dataSource={null}>
      <div className="auth-page auth-page--centered">
        <div className="auth-card auth-card--wide auth-card--comfort">
          <p className="auth-card__eyebrow">{t("auth.loginEyebrow")}</p>
          <h1 className="auth-card__title">{t("auth.loginTitle")}</h1>
          <p className="auth-card__lead auth-card__lead--stacked">
            <span className="auth-card__lead-line">{t("auth.loginLead1")}</span>
            <span className="auth-card__lead-line">
              {t("auth.loginLead2Before")}
              <Link to="/">{t("auth.loginLead2Link")}</Link> {t("auth.loginLead2After")}
            </span>
          </p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label className="field__label" htmlFor="login-email">
                {t("auth.email")}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field__input"
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="login-password">
                {t("auth.passwordLabel")}
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="field__input"
              />
            </div>
            {error && (
              <div className="alert alert--error" role="alert">
                {error}
              </div>
            )}
            <button type="submit" className="btn btn--primary auth-submit" disabled={submitting}>
              {submitting ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>
          <p className="auth-footer">
            {t("auth.noAccount")} <Link to="/register">{t("auth.createOne")}</Link>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
