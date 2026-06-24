import { NavLink } from "react-router-dom";

import { useTranslation } from "../../i18n/LanguageContext.jsx";

import { getWorkspaceNavClient, getWorkspaceNavStaff } from "./workspaceConfig.js";

export function WorkspaceNav({ isClientPortal, variant = "dash" }) {
  const { t } = useTranslation();

  const items = isClientPortal ? getWorkspaceNavClient(t) : getWorkspaceNavStaff(t);

  const isTopbar = variant === "topbar";

  return (
    <nav
      className={`workspace-nav${isTopbar ? " workspace-nav--topbar" : ""}`}
      aria-label={t("workspace.navAria")}
    >
      <div className="workspace-nav__scroll">
        {items.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={Boolean(end)}
            className={({ isActive }) =>
              `shell-nav-pill workspace-nav__link${isActive ? " shell-nav-pill--active workspace-nav__link--active" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
