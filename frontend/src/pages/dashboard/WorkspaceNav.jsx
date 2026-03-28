import { NavLink } from "react-router-dom";
import { useTranslation } from "../../i18n/LanguageContext.jsx";
import { getWorkspaceNavClient, getWorkspaceNavStaff } from "./workspaceConfig.js";

export function WorkspaceNav({ isClientPortal }) {
  const { t } = useTranslation();
  const items = isClientPortal ? getWorkspaceNavClient(t) : getWorkspaceNavStaff(t);

  return (
    <nav className="workspace-nav" aria-label={t("workspace.navAria")}>
      <div className="workspace-nav__scroll">
        {items.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={Boolean(end)}
            className={({ isActive }) => `workspace-nav__link${isActive ? " workspace-nav__link--active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
