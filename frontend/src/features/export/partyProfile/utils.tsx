import { Link } from "react-router-dom";
import * as partiesApi from "../../../api/parties";

export function roleClass(role: string) {
  return `trade-setup-role trade-setup-role--${role}`;
}

export function positionClass(position: "primary" | "member") {
  return `party-profile__tier party-profile__tier--${position === "primary" ? "primary" : "subsidiary"}`;
}

export function positionLabel(position: "primary" | "member", t: (key: string) => string) {
  return position === "primary" ? t("partyProfile.positionPrimary") : t("partyProfile.positionMember");
}

export function partiesBase(isClientPortal: boolean) {
  return isClientPortal ? "/dashboard/trade-setup" : "/dashboard/clients/parties";
}

export function roleLabel(role: string, t: (key: string) => string) {
  const key = `tradeSetup.role${role.charAt(0).toUpperCase()}${role.slice(1)}`;
  return t(key);
}

export function relationshipLabel(type: string, t: (key: string) => string) {
  if (!type) return "";
  const relKey = `partyProfile.relationship.${type}`;
  const rel = t(relKey);
  if (rel !== relKey) return rel;
  return roleLabel(type, t);
}

export function ChainPartyLink({
  partyId,
  name,
  code,
  tradeBase,
}: {
  partyId: string;
  name: string;
  code?: string;
  tradeBase: string;
}) {
  if (!name) return <>—</>;
  return (
    <>
      <Link to={`${tradeBase}/parties/${partyId}`} className="party-profile-link">
        {name}
      </Link>
      {code ? (
        <>
          {" "}
          <code className="dash__code party-profile__inline-code">{code}</code>
        </>
      ) : null}
    </>
  );
}

export function formatAddressLine(entry: partiesApi.PartyAddress) {
  return [entry.line1, entry.line2, entry.postalCode, entry.city, entry.country].filter(Boolean).join(", ");
}

export function displayHeroAddress(profile: partiesApi.PartyProfile) {
  const primary = profile.addressBook.find((a) => a.isPrimary) ?? profile.addressBook[0];
  if (primary) return formatAddressLine(primary);
  if (profile.address?.trim()) {
    return [profile.address, profile.city, profile.country].filter(Boolean).join(", ");
  }
  return "—";
}
