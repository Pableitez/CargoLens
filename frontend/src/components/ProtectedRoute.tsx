import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../i18n/LanguageContext.jsx";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="gate-loading">
        <div className="gate-loading__card" role="status" aria-live="polite" aria-busy="true">
          <div className="gate-loading__spinner" aria-hidden />
          <p className="gate-loading__text">{t("auth.sessionChecking")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }

  return children;
}
