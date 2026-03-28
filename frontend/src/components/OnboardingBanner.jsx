import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

const STORAGE_KEY = "freightboard-onboarding-dismissed";

export function OnboardingBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setVisible(false);
        return;
      }
    } catch {
      // ignorar
    }
    setVisible(true);
  }, [user]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignorar
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="onboarding-banner" role="region" aria-label={t("onboarding.title")}>
      <div className="onboarding-banner__inner">
        <p className="onboarding-banner__title">{t("onboarding.title")}</p>
        <ul className="onboarding-banner__list">
          <li>{t("onboarding.body1")}</li>
          <li>{t("onboarding.body2")}</li>
          <li>{t("onboarding.body3")}</li>
        </ul>
        <button type="button" className="onboarding-banner__dismiss" onClick={dismiss}>
          {t("onboarding.dismiss")}
        </button>
      </div>
    </div>
  );
}
