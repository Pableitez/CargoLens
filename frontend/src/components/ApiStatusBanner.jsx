import { useEffect, useState } from "react";
import { useApiConnectivity } from "../contexts/ApiConnectivityContext.jsx";
import { useTranslation } from "../i18n/LanguageContext.jsx";

// Aviso cuando la API no responde (red).
export function ApiStatusBanner() {
  const { t } = useTranslation();
  const { offline } = useApiConnectivity();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!offline) setDismissed(false);
  }, [offline]);

  if (!offline || dismissed) return null;

  return (
    <div className="api-status-banner" role="alert">
      <div className="api-status-banner__inner">
        <p className="api-status-banner__text">{t("apiBanner.offline")}</p>
        <button type="button" className="btn btn--ghost btn--sm api-status-banner__dismiss" onClick={() => setDismissed(true)}>
          {t("apiBanner.dismiss")}
        </button>
      </div>
    </div>
  );
}
