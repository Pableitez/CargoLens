import { Link } from "react-router-dom";
import { usePartyProfileContext } from "./PartyProfileContext";
import { displayHeroAddress, roleClass, roleLabel } from "./utils";

export function PartyProfileHero() {
  const {
    t,
    tradeBase,
    profile,
    clients,
    section,
    isClientParty,
    isPrimaryClient,
    chainCount,
    handleSectionChange,
  } = usePartyProfileContext();

  if (!profile) return null;

  return (
    <header className="party-profile__hero">
      <div className="party-profile__hero-main">
        <h1 id="party-profile-heading" className="party-profile__name">
          {profile.legalName}
        </h1>
        <div className="party-profile__badge-strip" aria-label={t("partyProfile.heroBadgesAria")}>
          <code className="party-profile__badge party-profile__badge--code">{profile.code}</code>
          {isClientParty ? (
            <>
              <span className="party-profile__badge party-profile__badge--contractual">
                {t("tradeSetup.accountTypeContractual")}
              </span>
              <span
                className={`party-profile__badge party-profile__badge--${isPrimaryClient ? "primary" : "subsidiary"}`}
              >
                {t(`tradeSetup.tier${isPrimaryClient ? "Primary" : "Subsidiary"}`)}
              </span>
            </>
          ) : (
            <span className="party-profile__badge party-profile__badge--operational">
              {t("tradeSetup.accountTypeOperational")}
            </span>
          )}
          {profile.roles.map((role) => (
            <span key={role} className={`party-profile__badge party-profile__badge--role ${roleClass(role)}`}>
              {roleLabel(role, t)}
            </span>
          ))}
          {chainCount > 0 ? (
            <button
              type="button"
              className={`party-profile__badge party-profile__badge--chains party-profile__badge-btn${section === "chains" ? " party-profile__badge-btn--active" : ""}`}
              onClick={() => handleSectionChange("chains")}
            >
              {t("partyProfile.chainsChip", { count: chainCount })}
            </button>
          ) : null}
        </div>
      </div>
      <dl className="party-profile__meta-grid">
        {isClientParty && profile.parentPartyId ? (
          <div className="party-profile__meta-grid--wide">
            <dt>{t("partyProfile.parentAccount")}</dt>
            <dd>
              <Link to={`${tradeBase}/parties/${profile.parentPartyId}`} className="party-profile-link">
                {clients.find((c) => c.id === profile.parentPartyId)?.name ?? profile.parentPartyId}
              </Link>
            </dd>
          </div>
        ) : null}
        <div>
          <dt>{t("tradeSetup.partyCountry")}</dt>
          <dd>{profile.country || "—"}</dd>
        </div>
        <div>
          <dt>{t("partyProfile.city")}</dt>
          <dd>{profile.city || "—"}</dd>
        </div>
        <div>
          <dt>{t("parties.thVat")}</dt>
          <dd>{profile.vat || "—"}</dd>
        </div>
        <div className="party-profile__meta-grid--wide">
          <dt>{t("partyProfile.address")}</dt>
          <dd>{displayHeroAddress(profile)}</dd>
        </div>
      </dl>
    </header>
  );
}
