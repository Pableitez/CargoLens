import { NavLink } from "react-router-dom";
import {
  getSidebarDocumentsGroup,
  getSidebarInsightsGroup,
  getSidebarOperationGroups,
  getSidebarPlatformNav,
} from "./sidebarModuleConfig.js";

function SubmoduleLinks({ handleNav, handlePrefetch, t, group }) {
  return group.submodules.map((sub) => (
    <NavLink
      key={sub.id}
      to={sub.route}
      className={({ isActive }) =>
        `shell-nav-menu__item sidebar__link sidebar__link--sub${isActive ? " shell-nav-menu__item--active sidebar__link--active" : ""}`
      }
      onClick={handleNav}
      onMouseEnter={() => handlePrefetch(sub.route)}
    >
      <span>{t(sub.i18nKey)}</span>
    </NavLink>
  ));
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
}) {
  const platformNav = getSidebarPlatformNav(staff);
  const operationGroups = getSidebarOperationGroups(staff);
  const documentsGroup = getSidebarDocumentsGroup(staff);
  const insightsGroup = getSidebarInsightsGroup(staff);

  return (
    <>
      <SidebarNavSection
        sectionId="platform"
        label={t("modules.sidebar.groupPlatform")}
        open={openGroups.platform}
        onToggle={() => toggleSection("platform")}
      >
        {platformNav.map((item) => (
          <NavLink
            key={item.id}
            to={item.route}
            end={Boolean(item.end)}
            className={navCls}
            onClick={handleNav}
            onMouseEnter={() => handlePrefetch(item.route)}
          >
            <span>{t(item.i18nKey)}</span>
          </NavLink>
        ))}
      </SidebarNavSection>

      {operationGroups.map((group) => (
        <SidebarNavSection
          key={group.id}
          sectionId={`ops-${group.id}`}
          label={t(group.i18nTitleKey)}
          open={openGroups[`ops-${group.id}`]}
          onToggle={() => toggleSection(`ops-${group.id}`)}
        >
          <SubmoduleLinks group={group} handleNav={handleNav} handlePrefetch={handlePrefetch} t={t} />
        </SidebarNavSection>
      ))}

      {documentsGroup ? (
        <SidebarNavSection
          sectionId="documents"
          label={t(documentsGroup.i18nTitleKey)}
          open={openGroups.documents}
          onToggle={() => toggleSection("documents")}
        >
          <SubmoduleLinks
            group={documentsGroup}
            handleNav={handleNav}
            handlePrefetch={handlePrefetch}
            t={t}
          />
        </SidebarNavSection>
      ) : null}

      {insightsGroup ? (
        <SidebarNavSection
          sectionId="insights"
          label={t(insightsGroup.i18nTitleKey)}
          open={openGroups.insights}
          onToggle={() => toggleSection("insights")}
        >
          <SubmoduleLinks group={insightsGroup} handleNav={handleNav} handlePrefetch={handlePrefetch} t={t} />
        </SidebarNavSection>
      ) : null}
    </>
  );
}
