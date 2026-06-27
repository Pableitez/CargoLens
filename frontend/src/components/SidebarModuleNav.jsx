import { NavLink } from "react-router-dom";
import {
  getSidebarDocumentsGroup,
  getSidebarHomeLink,
  getSidebarInsightsGroup,
  getSidebarOperationGroups,
  getSidebarSettingsGroup,
} from "./sidebarModuleConfig.js";
import { getClientDashboardNav } from "../config/moduleRegistry.ts";
import { SidebarNavIcon } from "./sidebarNavIcons.tsx";

function SidebarNavGlyph({ moduleId }) {
  return (
    <span className="sidebar__link-glyph" aria-hidden>
      <SidebarNavIcon moduleId={moduleId} />
    </span>
  );
}

function SidebarTextLink({ to, end, label, moduleId, navCls, handleNav, handlePrefetch, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={navCls}
      onClick={handleNav}
      onMouseEnter={() => handlePrefetch(to)}
      title={collapsed ? label : undefined}
    >
      {collapsed ? <SidebarNavGlyph moduleId={moduleId} /> : null}
      <span className="sidebar__link-text">{label}</span>
    </NavLink>
  );
}

function SubmoduleLinks({ handleNav, handlePrefetch, t, group, collapsed }) {
  return group.submodules.map((sub) => {
    const label = t(sub.i18nKey);
    return (
      <NavLink
        key={sub.id}
        to={sub.route}
        className={({ isActive }) =>
          `shell-nav-menu__item sidebar__link sidebar__link--sub${isActive ? " shell-nav-menu__item--active sidebar__link--active" : ""}`
        }
        onClick={handleNav}
        onMouseEnter={() => handlePrefetch(sub.route)}
        title={collapsed ? label : undefined}
      >
        {collapsed ? <SidebarNavGlyph moduleId={sub.id} /> : null}
        <span className="sidebar__link-text">{label}</span>
      </NavLink>
    );
  });
}

export function SidebarModuleNav({
  staff,
  navCls,
  handleNav,
  handlePrefetch,
  t,
  SidebarNavSection,
  openGroups,
  toggleSection,
  collapsed = false,
}) {
  const homeLink = getSidebarHomeLink();
  const operationGroups = getSidebarOperationGroups(staff);
  const documentsGroup = getSidebarDocumentsGroup(staff);
  const insightsGroup = getSidebarInsightsGroup(staff);
  const settingsGroup = getSidebarSettingsGroup(staff);
  const clientNav = staff ? [] : getClientDashboardNav().filter((item) => item.id !== "home");

  return (
    <>
      <div className="sidebar__group sidebar__group--primary">
        <SidebarTextLink
          to={homeLink.route}
          end={Boolean(homeLink.end)}
          label={t(homeLink.i18nKey)}
          moduleId={homeLink.id}
          navCls={navCls}
          handleNav={handleNav}
          handlePrefetch={handlePrefetch}
          collapsed={collapsed}
        />
        {clientNav.map((item) => (
          <SidebarTextLink
            key={item.id}
            to={item.route}
            end={Boolean(item.end)}
            label={t(item.i18nKey)}
            moduleId={item.id === "messages" ? "messages" : item.id}
            navCls={navCls}
            handleNav={handleNav}
            handlePrefetch={handlePrefetch}
            collapsed={collapsed}
          />
        ))}
      </div>

      {operationGroups.map((group) => (
        <SidebarNavSection
          key={group.id}
          sectionId={`ops-${group.id}`}
          iconModuleId={group.id}
          label={t(group.i18nTitleKey)}
          open={openGroups[`ops-${group.id}`]}
          onToggle={() => toggleSection(`ops-${group.id}`)}
          collapsed={collapsed}
        >
          <SubmoduleLinks
            group={group}
            handleNav={handleNav}
            handlePrefetch={handlePrefetch}
            t={t}
            collapsed={collapsed}
          />
        </SidebarNavSection>
      ))}

      {documentsGroup ? (
        <SidebarNavSection
          sectionId="documents"
          iconModuleId="documents"
          label={t(documentsGroup.i18nTitleKey)}
          open={openGroups.documents}
          onToggle={() => toggleSection("documents")}
          collapsed={collapsed}
        >
          <SubmoduleLinks
            group={documentsGroup}
            handleNav={handleNav}
            handlePrefetch={handlePrefetch}
            t={t}
            collapsed={collapsed}
          />
        </SidebarNavSection>
      ) : null}

      {insightsGroup ? (
        <SidebarNavSection
          sectionId="insights"
          iconModuleId="insights"
          label={t(insightsGroup.i18nTitleKey)}
          open={openGroups.insights}
          onToggle={() => toggleSection("insights")}
          collapsed={collapsed}
        >
          <SubmoduleLinks
            group={insightsGroup}
            handleNav={handleNav}
            handlePrefetch={handlePrefetch}
            t={t}
            collapsed={collapsed}
          />
        </SidebarNavSection>
      ) : null}

      {settingsGroup ? (
        <SidebarNavSection
          sectionId="settings"
          iconModuleId="settings"
          label={t(settingsGroup.i18nTitleKey)}
          open={openGroups.settings}
          onToggle={() => toggleSection("settings")}
          collapsed={collapsed}
        >
          <SubmoduleLinks
            group={settingsGroup}
            handleNav={handleNav}
            handlePrefetch={handlePrefetch}
            t={t}
            collapsed={collapsed}
          />
        </SidebarNavSection>
      ) : null}
    </>
  );
}
