import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCountryLabel } from "@shared/domain/isoCountries.js";
import { normalizePartyVat } from "@shared/domain/partyVat.js";
import type { TradeMastersImportKind } from "../../../api/tradeMastersImport";
import type { SupplyChain } from "../../../api/supplyChains";
import { EntitySearchPicker } from "../../../components/EntitySearchPicker";
import { PartyBeCodeFields } from "../../../components/PartyBeCodeFields";
import { TradeMastersImportModal } from "../TradeMastersImportModal";
import { PartyProfileHero } from "./PartyProfileHero";
import {
  ADDRESS_LABELS,
  CORPORATE_RELATION_TYPES,
  EMPTY_ADDRESS,
  EMPTY_CHAIN,
  EMPTY_CONTACT,
  EMPTY_FACILITY_LINK,
  EMPTY_RELATION,
  FACILITY_PURPOSES,
  PARTY_ROLES,
} from "./constants";
import { usePartyProfileContext } from "./PartyProfileContext";
import {
  ChainPartyLink,
  displayHeroAddress,
  formatAddressLine,
  positionClass,
  positionLabel,
  relationshipLabel,
  roleClass,
  roleLabel,
} from "./utils";

export function PartyProfileView() {
  const {
    partyId,
    t,
    locale,
    isClientPortal,
    portalClient,
    tradeBase,
    facilitiesBase,
    profile,
    clients,
    section,
    showHubForm,
    editingHubId,
    editingIdentity,
    showAddressForm,
    showContactForm,
    showRelationForm,
    showFacilityForm,
    selectedFacilityIds,
    setSelectedFacilityIds,
    selectedPartyIds,
    setSelectedPartyIds,
    hubForm,
    setHubForm,
    identityForm,
    setIdentityForm,
    onIdentityCodeTouched,
    onIdentitySuggestReset,
    addressDraft,
    setAddressDraft,
    contactDraft,
    setContactDraft,
    relationDraft,
    setRelationDraft,
    facilityDraft,
    setFacilityDraft,
    loading,
    saving,
    deleting,
    error,
    handleSectionChange,
    cancelIdentityEdit,
    searchParties,
    searchFacilities,
    partySearchFields,
    facilitySearchFields,
    linkedPartyIds,
    linkedFacilityIds,
    sections,
    handleSaveIdentity,
    handleAddAddress,
    handleRemoveAddress,
    handleAddContact,
    handleRemoveContact,
    handleAddRelations,
    handleRemoveRelation,
    handleAddFacilityLinks,
    handleRemoveFacilityLink,
    handleDeleteParty,
    isClientParty,
    isPrimaryClient,
    isSubsidiaryClient,
    cancelHubForm,
    openHubForm,
    handleSaveHub,
    chainPositionCounts,
    handleAddSubsidiaries,
    handleRemoveSubsidiary,
    searchSubsidiaryCandidates,
    showSubsidiaryForm,
    selectedSubsidiaryIds,
    setSelectedSubsidiaryIds,
    setShowSubsidiaryForm,
    linkedSubsidiaryIds,
    setEditingIdentity,
    setShowAddressForm,
    setShowContactForm,
    setShowRelationForm,
    setShowFacilityForm,
    load,
  } = usePartyProfileContext();

  const [importKind, setImportKind] = useState<TradeMastersImportKind | null>(null);

  if (loading) {
    return <p className="panel__muted">{t("partyProfile.loading")}</p>;
  }

  if (!profile) {
    return (
      <section className="panel panel--trade-setup panel--party-profile">
        {error ? (
          <p className="panel__error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className="panel panel--trade-setup panel--party-profile"
      aria-labelledby="party-profile-heading"
    >
      <PartyProfileHero />

      {error ? (
        <p className="panel__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="party-profile__layout">
        <nav className="party-profile__nav" aria-label={t("partyProfile.sectionsAria")}>
          <ul className="party-profile__nav-list">
            {sections.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`party-profile__nav-btn${section === item.id ? " party-profile__nav-btn--active" : ""}`}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <span className="party-profile__nav-label">{item.label}</span>
                  {item.count !== null ? (
                    <span className="party-profile__nav-count">{item.count}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div id="party-profile-content" className="party-profile__content">
          {section === "identity" ? (
            <div className="trade-setup-card">
              <div className="party-profile__section-head">
                <div>
                  <h2 className="trade-setup-card__title">{t("partyProfile.sectionIdentity")}</h2>
                </div>
                <div className="party-profile__chain-card-actions">
                  {!editingIdentity ? (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => setEditingIdentity(true)}
                    >
                      {t("partyProfile.edit")}
                    </button>
                  ) : null}
                  {!isClientPortal ? (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm btn--danger"
                      disabled={deleting || saving}
                      onClick={() => void handleDeleteParty()}
                    >
                      {t("parties.deleteParty")}
                    </button>
                  ) : null}
                </div>
              </div>

              {!editingIdentity ? (
                <dl className="party-profile__detail-grid">
                  <div className="party-profile__detail-grid--wide">
                    <dt>{t("partyField.party")}</dt>
                    <dd>{profile.legalName}</dd>
                  </div>
                  <div>
                    <dt>{t("partyField.beCode")}</dt>
                    <dd>
                      <code className="dash__code">{profile.code}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("tradeSetup.partyCountry")}</dt>
                    <dd>{formatCountryLabel(profile.country, locale) || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("partyProfile.city")}</dt>
                    <dd>{profile.city || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("parties.thVat")}</dt>
                    <dd>{profile.vat || "—"}</dd>
                  </div>
                  <div className="party-profile__detail-grid--wide">
                    <dt>{t("partyProfile.registeredOffice")}</dt>
                    <dd>{profile.address?.trim() || displayHeroAddress(profile)}</dd>
                  </div>
                  <div className="party-profile__detail-grid--wide">
                    <dt>{t("partyProfile.notes")}</dt>
                    <dd>{profile.notes?.trim() || "—"}</dd>
                  </div>
                  <div>
                    <dt>{t("tradeSetup.accountType")}</dt>
                    <dd>
                      {isClientParty
                        ? t("tradeSetup.accountTypeContractual")
                        : t("tradeSetup.accountTypeOperational")}
                    </dd>
                  </div>
                  {isClientParty ? (
                    <>
                      <div>
                        <dt>{t("dashboardPage.clients.contractualTierLabel")}</dt>
                        <dd>
                          {t(
                            `dashboardPage.clients.tier${(profile.contractualTier ?? "primary") === "subsidiary" ? "Subsidiary" : "Primary"}`
                          )}
                        </dd>
                      </div>
                      {profile.parentPartyId ? (
                        <div className="party-profile__detail-grid--wide">
                          <dt>{t("dashboardPage.clients.thParent")}</dt>
                          <dd>
                            <Link
                              to={`${tradeBase}/parties/${profile.parentPartyId}`}
                              className="party-profile-link"
                            >
                              {clients.find((c) => c.id === profile.parentPartyId)?.name ??
                                profile.parentPartyId}
                            </Link>
                          </dd>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="party-profile__detail-grid--wide">
                      <dt>{t("partyProfile.accountTypeHintTitle")}</dt>
                      <dd className="party-profile__inline-note">
                        {t("partyProfile.accountTypeOperationalHint")}
                      </dd>
                    </div>
                  )}
                  {isPrimaryClient && (profile.subsidiaries?.length ?? 0) > 0 ? (
                    <div className="party-profile__detail-grid--wide">
                      <dt>{t("partyProfile.sectionSubsidiaries")}</dt>
                      <dd>
                        {t("partyProfile.subsidiariesCountInline", {
                          count: profile.subsidiaries?.length ?? 0,
                        })}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : (
                <form className="party-profile__edit-form" onSubmit={handleSaveIdentity}>
                  <div className="party-profile__form-grid">
                    {!isClientPortal ? (
                      <div className="field field--span-12">
                        <label className="field__label" htmlFor="profile-account-tier">
                          {t("tradeSetup.accountType")}
                        </label>
                        <select
                          id="profile-account-tier"
                          className="field__input"
                          value={identityForm.accountTier}
                          onChange={(e) =>
                            setIdentityForm((f) => ({
                              ...f,
                              accountTier: e.target.value as "operational" | "contractual",
                            }))
                          }
                          disabled={isPrimaryClient && (profile.subsidiaries?.length ?? 0) > 0}
                        >
                          <option value="operational">{t("tradeSetup.accountTypeOperational")}</option>
                          <option value="contractual">{t("tradeSetup.accountTypeContractual")}</option>
                        </select>
                        <p className="field__hint">
                          {isPrimaryClient && (profile.subsidiaries?.length ?? 0) > 0
                            ? t("partyProfile.accountTypePrimaryWithSubsHint")
                            : identityForm.accountTier === "contractual"
                              ? t("partyProfile.accountTypeContractualHint")
                              : t("partyProfile.accountTypeOperationalHint")}
                        </p>
                      </div>
                    ) : null}
                    <PartyBeCodeFields
                      idPrefix="profile"
                      value={identityForm}
                      onChange={(patch) => setIdentityForm((f) => ({ ...f, ...patch }))}
                      onCodeTouched={onIdentityCodeTouched}
                      onSuggestReset={onIdentitySuggestReset}
                    />
                    <div className="field field--span-6">
                      <label className="field__label" htmlFor="profile-city">
                        {t("partyProfile.city")}
                      </label>
                      <input
                        id="profile-city"
                        className="field__input"
                        value={identityForm.city}
                        onChange={(e) => setIdentityForm((f) => ({ ...f, city: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-6">
                      <label className="field__label" htmlFor="profile-vat">
                        {t("parties.fieldVat")}
                      </label>
                      <input
                        id="profile-vat"
                        className="field__input"
                        value={identityForm.vat}
                        required
                        autoComplete="off"
                        placeholder={t("parties.fieldVatPlaceholder")}
                        onChange={(e) => setIdentityForm((f) => ({ ...f, vat: e.target.value }))}
                        onBlur={(e) =>
                          setIdentityForm((f) => ({ ...f, vat: normalizePartyVat(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="field field--span-12">
                      <label className="field__label" htmlFor="profile-address">
                        {t("partyProfile.registeredOffice")}
                      </label>
                      <input
                        id="profile-address"
                        className="field__input"
                        value={identityForm.address}
                        onChange={(e) => setIdentityForm((f) => ({ ...f, address: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-12">
                      <label className="field__label" htmlFor="profile-notes">
                        {t("partyProfile.notes")}
                      </label>
                      <textarea
                        id="profile-notes"
                        className="field__input field__textarea"
                        rows={3}
                        value={identityForm.notes}
                        onChange={(e) => setIdentityForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="party-profile__form-actions">
                    <button type="submit" className="btn btn--primary" disabled={saving}>
                      {saving ? t("partyProfile.saving") : t("partyProfile.save")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={saving}
                      onClick={cancelIdentityEdit}
                    >
                      {t("partyProfile.cancel")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : null}

          {section === "subsidiaries" ? (
            <div className="trade-setup-card">
              <div className="party-profile__section-head">
                <div>
                  <h2 className="trade-setup-card__title">{t("partyProfile.sectionSubsidiaries")}</h2>
                  <p className="party-profile__inline-note">{t("partyProfile.subsidiariesLead")}</p>
                </div>
                {!showSubsidiaryForm ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setShowSubsidiaryForm(true)}
                  >
                    {t("partyProfile.addSubsidiary")}
                  </button>
                ) : null}
              </div>

              {(profile.subsidiaries ?? []).length === 0 ? (
                <p className="panel__muted">{t("partyProfile.noSubsidiaries")}</p>
              ) : (
                <ul className="party-profile__item-list">
                  {(profile.subsidiaries ?? []).map((row) => (
                    <li key={row.id} className="party-profile__item-card">
                      <div className="party-profile__item-head">
                        <span className="party-profile__item-label">
                          <Link to={`${tradeBase}/parties/${row.id}`} className="party-profile-link">
                            {row.legalName}
                          </Link>
                          <code className="dash__code party-profile__inline-code">{row.code}</code>
                        </span>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm btn--danger"
                          disabled={saving}
                          onClick={() => void handleRemoveSubsidiary(row.id)}
                        >
                          {t("partyProfile.removeSubsidiary")}
                        </button>
                      </div>
                      <p className="party-profile__item-meta">
                        {row.country ? formatCountryLabel(row.country, locale) : "—"}
                        {row.vat ? ` · ${row.vat}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {showSubsidiaryForm ? (
                <form className="party-profile__add-form" onSubmit={handleAddSubsidiaries}>
                  <p className="party-profile__inline-note">{t("partyProfile.addSubsidiaryLead")}</p>
                  <EntitySearchPicker
                    id="subsidiary-party-picker"
                    multiple
                    value={selectedSubsidiaryIds}
                    onChange={setSelectedSubsidiaryIds}
                    onSearch={searchSubsidiaryCandidates}
                    searchFields={partySearchFields}
                    excludeIds={[...(partyId ? [partyId] : []), ...linkedSubsidiaryIds]}
                    placeholder={t("partyProfile.searchSubsidiaryParties")}
                  />
                  <div className="party-profile__form-actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saving || selectedSubsidiaryIds.length === 0}
                    >
                      {saving
                        ? t("partyProfile.saving")
                        : t("partyProfile.linkSelected", { count: selectedSubsidiaryIds.length })}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={saving}
                      onClick={() => {
                        setSelectedSubsidiaryIds([]);
                        setShowSubsidiaryForm(false);
                      }}
                    >
                      {t("partyProfile.cancel")}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {section === "chains" ? (
            <>
              <div className="trade-setup-card">
                <div className="party-profile__section-head">
                  <div>
                    <h2 className="trade-setup-card__title">{t("partyProfile.chainNetworkTitle")}</h2>
                    <p className="party-profile__inline-note">{t("partyProfile.chainNetworkLead")}</p>
                  </div>
                  {!isPrimaryClient ? (
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleSectionChange("related")}
                    >
                      {t("partyProfile.manageRelated")}
                    </button>
                  ) : null}
                </div>
                <ul className="party-profile__chain-list">
                  {(profile.chainMemberships ?? []).length === 0 ? (
                    <li className="party-profile__list-empty">
                      {isPrimaryClient
                        ? t("partyProfile.chainParticipationEmptyPrimary")
                        : t("partyProfile.chainMembersEmpty")}
                    </li>
                  ) : (
                    (profile.chainMemberships ?? []).map((row) => (
                      <li
                        key={row.chainId}
                        className={`party-profile__chain-card party-profile__chain-card--${row.chainPosition}`}
                      >
                        <div className="party-profile__chain-card-head">
                          <div className="party-profile__chain-card-focus">
                            <p className="party-profile__chain-card-kicker">
                              {t("partyProfile.chainSupplyFor")}
                            </p>
                            <p className="party-profile__chain-card-client-name">
                              {row.clientId && row.clientName ? (
                                <ChainPartyLink
                                  partyId={row.clientId}
                                  name={row.clientName}
                                  code={row.clientCode}
                                  tradeBase={tradeBase}
                                />
                              ) : (
                                "—"
                              )}
                            </p>
                          </div>
                          <div className="party-profile__chain-card-actions">
                            <span
                              className={positionClass(
                                row.chainPosition === "primary" ? "primary" : "member"
                              )}
                            >
                              {positionLabel(row.chainPosition === "primary" ? "primary" : "member", t)}
                            </span>
                          </div>
                        </div>
                        <dl className="party-profile__chain-card-meta">
                          {row.hubPartyName ? (
                            <div>
                              <dt>{t("partyProfile.chainOperationalParty")}</dt>
                              <dd>
                                {row.hubPartyId ? (
                                  <ChainPartyLink
                                    partyId={row.hubPartyId}
                                    name={row.hubPartyName}
                                    code={row.hubPartyCode ?? ""}
                                    tradeBase={tradeBase}
                                  />
                                ) : (
                                  row.hubPartyName
                                )}
                              </dd>
                            </div>
                          ) : null}
                          {row.operationalRole ? (
                            <div>
                              <dt>{t("partyProfile.chainYourRole")}</dt>
                              <dd>{roleLabel(row.operationalRole, t)}</dd>
                            </div>
                          ) : null}
                          {row.direction ? (
                            <div>
                              <dt>{t("tradeSetup.direction")}</dt>
                              <dd>
                                {t(
                                  `tradeSetup.direction${row.direction.charAt(0).toUpperCase()}${row.direction.slice(1)}`
                                )}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      </li>
                    ))
                  )}
                </ul>
                {!isPrimaryClient && !isClientPortal ? (
                  <p className="party-profile__inline-note">{t("partyProfile.chainsManagedOnContractual")}</p>
                ) : null}
              </div>

              {isPrimaryClient && !isClientPortal ? (
                <div className="trade-setup-card">
                  <div className="party-profile__section-head">
                    <div>
                      <h2 className="trade-setup-card__title">{t("partyProfile.ownedChainsTitle")}</h2>
                      <p className="party-profile__inline-note">{t("partyProfile.ownedChainsLead")}</p>
                    </div>
                    {!showHubForm ? (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => openHubForm()}
                      >
                        {t("partyProfile.addSupplyChain")}
                      </button>
                    ) : null}
                  </div>

                  {(profile.ownedSupplyChains ?? []).length === 0 && !showHubForm ? (
                    <p className="panel__muted">{t("partyProfile.noOwnedChains")}</p>
                  ) : (
                    <ul className="party-profile__item-list">
                      {(profile.ownedSupplyChains ?? []).map((row) => (
                        <li key={row.chainId} className="party-profile__item-card">
                          <div className="party-profile__item-head">
                            <span className="party-profile__item-label">
                              {row.chainName}{" "}
                              <code className="dash__code party-profile__inline-code">{row.chainCode}</code>
                            </span>
                            {!showHubForm ? (
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={() => openHubForm(row)}
                              >
                                {t("partyProfile.edit")}
                              </button>
                            ) : null}
                          </div>
                          <p className="party-profile__item-meta">
                            {row.primaryPartyName ? (
                              <>
                                {t("partyProfile.chainOperationalParty")}: {row.primaryPartyName}{" "}
                                <code className="dash__code">{row.primaryPartyCode}</code>
                                {" · "}
                              </>
                            ) : null}
                            {t(
                              `tradeSetup.direction${row.direction.charAt(0).toUpperCase()}${row.direction.slice(1)}`
                            )}
                            {" · "}
                            {roleLabel(row.primaryRole, t)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {showHubForm ? (
                    <form
                      className="party-profile__add-form party-profile__chain-panel"
                      onSubmit={handleSaveHub}
                    >
                      <header className="party-profile__add-head">
                        <h3 className="party-profile__add-title">
                          {editingHubId
                            ? t("partyProfile.editSupplyChain")
                            : t("partyProfile.addSupplyChain")}
                        </h3>
                        <p className="party-profile__inline-note">{t("partyProfile.addSupplyChainLead")}</p>
                      </header>
                      <div className="party-profile__form-grid">
                        <div className="field field--span-12">
                          <label className="field__label" htmlFor="chain-operational-party">
                            {t("partyProfile.chainOperationalParty")} <span className="field__req">*</span>
                          </label>
                          <EntitySearchPicker
                            id="chain-operational-party"
                            value={hubForm.primaryPartyId}
                            onChange={(value) => setHubForm((f) => ({ ...f, primaryPartyId: value }))}
                            onSearch={searchParties}
                            searchFields={partySearchFields}
                            placeholder={t("partyProfile.searchOperationalParty")}
                          />
                          <p className="field__hint">{t("partyProfile.chainOperationalPartyHint")}</p>
                        </div>
                        <div className="field field--span-12">
                          <label className="field__label" htmlFor="chain-name">
                            {t("tradeSetup.chainName")} <span className="field__req">*</span>
                          </label>
                          <input
                            id="chain-name"
                            className="field__input"
                            value={hubForm.name}
                            onChange={(e) => setHubForm((f) => ({ ...f, name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="field field--span-6">
                          <label className="field__label" htmlFor="chain-direction">
                            {t("tradeSetup.direction")}
                          </label>
                          <select
                            id="chain-direction"
                            className="field__input"
                            value={hubForm.direction}
                            onChange={(e) =>
                              setHubForm((f) => ({
                                ...f,
                                direction: e.target.value as SupplyChain["direction"],
                              }))
                            }
                          >
                            <option value="export">{t("tradeSetup.directionExport")}</option>
                            <option value="import">{t("tradeSetup.directionImport")}</option>
                            <option value="domestic">{t("tradeSetup.directionDomestic")}</option>
                          </select>
                        </div>
                        <div className="field field--span-6">
                          <label className="field__label" htmlFor="chain-primary-role">
                            {t("tradeSetup.primaryRole")}
                          </label>
                          <select
                            id="chain-primary-role"
                            className="field__input"
                            value={hubForm.primaryRole}
                            onChange={(e) =>
                              setHubForm((f) => ({
                                ...f,
                                primaryRole: e.target.value as SupplyChain["primaryRole"],
                              }))
                            }
                          >
                            <option value="shipper">{t("tradeSetup.roleShipper")}</option>
                            <option value="consignee">{t("tradeSetup.roleConsignee")}</option>
                          </select>
                        </div>
                      </div>
                      <div className="party-profile__form-actions">
                        <button type="submit" className="btn btn--primary" disabled={saving}>
                          {saving ? t("partyProfile.saving") : t("partyProfile.save")}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={saving}
                          onClick={cancelHubForm}
                        >
                          {t("partyProfile.cancel")}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {section === "addresses" ? (
            <div className="trade-setup-card">
              <div className="party-profile__section-head">
                <div>
                  <h2 className="trade-setup-card__title">{t("partyProfile.sectionAddresses")}</h2>
                </div>
                {!showAddressForm ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setShowAddressForm(true)}
                  >
                    {t("partyProfile.addAddress")}
                  </button>
                ) : null}
              </div>

              <div className="party-profile__list-section">
                {profile.address?.trim() && profile.addressBook.length === 0 ? (
                  <div className="party-profile__address-card party-profile__address-card--legacy">
                    <p className="party-profile__address-primary">{t("partyProfile.registeredOffice")}</p>
                    <p>{profile.address}</p>
                    <p className="party-profile__address-meta">
                      {[profile.city, profile.country].filter(Boolean).join(", ") || "—"}
                    </p>
                    <p className="party-profile__legacy-hint">{t("partyProfile.legacyAddressHint")}</p>
                  </div>
                ) : null}
                {profile.addressBook.length === 0 && !profile.address?.trim() ? (
                  <p className="party-profile__list-empty">{t("partyProfile.noAddress")}</p>
                ) : profile.addressBook.length > 0 ? (
                  <ul className="party-profile__item-list">
                    {profile.addressBook.map((row) => (
                      <li key={row.id} className="party-profile__item-card">
                        <div className="party-profile__item-head">
                          <span className="party-profile__item-label">
                            {t(`partyProfile.addressLabel.${row.label}`)}
                            {row.isPrimary ? (
                              <span className="party-profile__item-badge">{t("partyProfile.primary")}</span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--danger"
                            disabled={saving}
                            onClick={() => row.id && void handleRemoveAddress(row.id)}
                          >
                            {t("partyProfile.remove")}
                          </button>
                        </div>
                        <p>{formatAddressLine(row)}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {showAddressForm ? (
                <form className="party-profile__add-form" onSubmit={handleAddAddress}>
                  <header className="party-profile__add-head">
                    <h3 className="party-profile__add-title">{t("partyProfile.addAddress")}</h3>
                  </header>
                  <div className="party-profile__form-grid">
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="addr-label">
                        {t("partyProfile.addressType")}
                      </label>
                      <select
                        id="addr-label"
                        className="field__input"
                        value={addressDraft.label}
                        onChange={(e) => setAddressDraft((d) => ({ ...d, label: e.target.value }))}
                      >
                        {ADDRESS_LABELS.map((label) => (
                          <option key={label} value={label}>
                            {t(`partyProfile.addressLabel.${label}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field field--span-8">
                      <label className="field__label" htmlFor="addr-line1">
                        {t("partyProfile.line1")} <span className="field__req">*</span>
                      </label>
                      <input
                        id="addr-line1"
                        className="field__input"
                        value={addressDraft.line1}
                        onChange={(e) => setAddressDraft((d) => ({ ...d, line1: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="field field--span-12">
                      <label className="field__label" htmlFor="addr-line2">
                        {t("partyProfile.line2")}
                      </label>
                      <input
                        id="addr-line2"
                        className="field__input"
                        value={addressDraft.line2}
                        onChange={(e) => setAddressDraft((d) => ({ ...d, line2: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="addr-city">
                        {t("partyProfile.city")}
                      </label>
                      <input
                        id="addr-city"
                        className="field__input"
                        value={addressDraft.city}
                        onChange={(e) => setAddressDraft((d) => ({ ...d, city: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="addr-country">
                        {t("tradeSetup.partyCountry")}
                      </label>
                      <input
                        id="addr-country"
                        className="field__input"
                        value={addressDraft.country}
                        onChange={(e) => setAddressDraft((d) => ({ ...d, country: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="addr-postal">
                        {t("partyProfile.postalCode")}
                      </label>
                      <input
                        id="addr-postal"
                        className="field__input"
                        value={addressDraft.postalCode}
                        onChange={(e) => setAddressDraft((d) => ({ ...d, postalCode: e.target.value }))}
                      />
                    </div>
                    <div className="party-profile__form-option field--span-12">
                      <label className="field__checkbox">
                        <input
                          type="checkbox"
                          checked={addressDraft.isPrimary}
                          onChange={(e) => setAddressDraft((d) => ({ ...d, isPrimary: e.target.checked }))}
                        />
                        {t("partyProfile.setPrimary")}
                      </label>
                    </div>
                  </div>
                  <div className="party-profile__form-actions">
                    <button type="submit" className="btn btn--primary" disabled={saving}>
                      {t("partyProfile.addEntry")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={saving}
                      onClick={() => {
                        setAddressDraft({ ...EMPTY_ADDRESS });
                        setShowAddressForm(false);
                      }}
                    >
                      {t("partyProfile.cancel")}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {section === "contacts" ? (
            <div className="trade-setup-card">
              <div className="party-profile__section-head">
                <div>
                  <h2 className="trade-setup-card__title">{t("partyProfile.sectionContacts")}</h2>
                </div>
                {!showContactForm ? (
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => setShowContactForm(true)}
                  >
                    {t("partyProfile.addContact")}
                  </button>
                ) : null}
              </div>
              <div className="party-profile__list-section">
                {profile.contacts.length === 0 ? (
                  <p className="party-profile__list-empty">{t("partyProfile.noContacts")}</p>
                ) : (
                  <ul className="party-profile__item-list">
                    {profile.contacts.map((row) => (
                      <li key={row.id} className="party-profile__item-card">
                        <div className="party-profile__item-head">
                          <span className="party-profile__item-label">
                            {row.name}
                            {row.isPrimary ? (
                              <span className="party-profile__item-badge">{t("partyProfile.primary")}</span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--danger"
                            disabled={saving}
                            onClick={() => row.id && void handleRemoveContact(row.id)}
                          >
                            {t("partyProfile.remove")}
                          </button>
                        </div>
                        <p className="party-profile__item-meta">
                          {[row.jobTitle, row.email, row.phone].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {showContactForm ? (
                <form className="party-profile__add-form" onSubmit={handleAddContact}>
                  <header className="party-profile__add-head">
                    <h3 className="party-profile__add-title">{t("partyProfile.addContact")}</h3>
                  </header>
                  <div className="party-profile__form-grid">
                    <div className="field field--span-8">
                      <label className="field__label" htmlFor="contact-name">
                        {t("partyProfile.contactName")} <span className="field__req">*</span>
                      </label>
                      <input
                        id="contact-name"
                        className="field__input"
                        value={contactDraft.name}
                        onChange={(e) => setContactDraft((d) => ({ ...d, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="contact-title">
                        {t("partyProfile.jobTitle")}
                      </label>
                      <input
                        id="contact-title"
                        className="field__input"
                        value={contactDraft.jobTitle}
                        onChange={(e) => setContactDraft((d) => ({ ...d, jobTitle: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-6">
                      <label className="field__label" htmlFor="contact-email">
                        {t("partyProfile.email")}
                      </label>
                      <input
                        id="contact-email"
                        className="field__input"
                        type="email"
                        value={contactDraft.email}
                        onChange={(e) => setContactDraft((d) => ({ ...d, email: e.target.value }))}
                      />
                    </div>
                    <div className="field field--span-6">
                      <label className="field__label" htmlFor="contact-phone">
                        {t("partyProfile.phone")}
                      </label>
                      <input
                        id="contact-phone"
                        className="field__input"
                        value={contactDraft.phone}
                        onChange={(e) => setContactDraft((d) => ({ ...d, phone: e.target.value }))}
                      />
                    </div>
                    <div className="party-profile__form-option field--span-12">
                      <label className="field__checkbox">
                        <input
                          type="checkbox"
                          checked={contactDraft.isPrimary}
                          onChange={(e) => setContactDraft((d) => ({ ...d, isPrimary: e.target.checked }))}
                        />
                        {t("partyProfile.setPrimary")}
                      </label>
                    </div>
                  </div>
                  <div className="party-profile__form-actions">
                    <button type="submit" className="btn btn--primary" disabled={saving}>
                      {t("partyProfile.addEntry")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={saving}
                      onClick={() => {
                        setContactDraft({ ...EMPTY_CONTACT });
                        setShowContactForm(false);
                      }}
                    >
                      {t("partyProfile.cancel")}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {section === "facilities" ? (
            <div className="trade-setup-card">
              <div className="party-profile__section-head">
                <div>
                  <h2 className="trade-setup-card__title">{t("partyProfile.sectionFacilities")}</h2>
                </div>
                {!showFacilityForm ? (
                  <div className="party-profile__chain-card-actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => setImportKind("related_facilities")}
                    >
                      {t("tradeMastersImport.importExcel")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => setShowFacilityForm(true)}
                    >
                      {t("partyProfile.addFacilityLinks")}
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="party-profile__legacy-hint">
                {t("partyProfile.facilitiesCatalogHint")}{" "}
                <Link to={facilitiesBase} className="party-profile-link">
                  {t("facilities.title")}
                </Link>
                {" · "}
                <button
                  type="button"
                  className="party-profile-link party-profile-link--btn"
                  onClick={() => setImportKind("related_facilities")}
                >
                  {t("tradeMastersImport.importExcel")}
                </button>
              </p>
              <div className="party-profile__list-section">
                {(profile.relatedFacilities ?? []).length === 0 ? (
                  <p className="party-profile__list-empty">{t("partyProfile.noFacilities")}</p>
                ) : (
                  <ul className="party-profile__item-list">
                    {(profile.relatedFacilities ?? []).map((row) => (
                      <li key={row.id} className="party-profile__item-card">
                        <div className="party-profile__item-head">
                          <span className="party-profile__item-label">
                            {row.facilityName}
                            <code className="dash__code party-profile__inline-code">{row.facilityCode}</code>
                          </span>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--danger"
                            disabled={saving}
                            onClick={() => row.id && void handleRemoveFacilityLink(row.id)}
                          >
                            {t("partyProfile.remove")}
                          </button>
                        </div>
                        <p className="party-profile__item-meta">
                          {t(`partyProfile.facilityPurpose.${row.purpose}`)}
                          {[row.city, row.country].filter(Boolean).length > 0
                            ? ` · ${[row.city, row.country].filter(Boolean).join(", ")}`
                            : ""}
                          {row.notes ? ` · ${row.notes}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {showFacilityForm ? (
                <form className="party-profile__add-form" onSubmit={handleAddFacilityLinks}>
                  <header className="party-profile__add-head">
                    <h3 className="party-profile__add-title">{t("partyProfile.addFacilityLinks")}</h3>
                  </header>
                  <div className="party-profile__form-grid">
                    <div className="field field--span-12">
                      <label className="field__label" htmlFor="related-facilities">
                        {t("partyProfile.facilities")} <span className="field__req">*</span>
                      </label>
                      <EntitySearchPicker
                        id="related-facilities"
                        multiple
                        value={selectedFacilityIds}
                        onChange={setSelectedFacilityIds}
                        onSearch={searchFacilities}
                        searchFields={facilitySearchFields}
                        excludeIds={[...linkedFacilityIds]}
                        placeholder={t("partyProfile.searchFacilities")}
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="facility-purpose">
                        {t("partyProfile.facilityPurposeLabel")}
                      </label>
                      <select
                        id="facility-purpose"
                        className="field__input"
                        value={facilityDraft.purpose}
                        onChange={(e) => setFacilityDraft((d) => ({ ...d, purpose: e.target.value }))}
                      >
                        {FACILITY_PURPOSES.map((purpose) => (
                          <option key={purpose} value={purpose}>
                            {t(`partyProfile.facilityPurpose.${purpose}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field field--span-8">
                      <label className="field__label" htmlFor="facility-notes">
                        {t("partyProfile.notes")}
                      </label>
                      <input
                        id="facility-notes"
                        className="field__input"
                        value={facilityDraft.notes}
                        onChange={(e) => setFacilityDraft((d) => ({ ...d, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="party-profile__form-actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saving || selectedFacilityIds.length === 0}
                    >
                      {saving
                        ? t("partyProfile.saving")
                        : t("partyProfile.linkSelected", { count: selectedFacilityIds.length })}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={saving}
                      onClick={() => {
                        setFacilityDraft({ ...EMPTY_FACILITY_LINK });
                        setSelectedFacilityIds([]);
                        setShowFacilityForm(false);
                      }}
                    >
                      {t("partyProfile.cancel")}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {section === "related" ? (
            <div className="trade-setup-card">
              <div className="party-profile__section-head">
                <div>
                  <h2 className="trade-setup-card__title">{t("partyProfile.sectionRelated")}</h2>
                  {isClientParty ? (
                    <p className="party-profile__inline-note">{t("partyProfile.relatedContractualHint")}</p>
                  ) : null}
                </div>
                {!showRelationForm ? (
                  <div className="party-profile__chain-card-actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => setImportKind("related_parties")}
                    >
                      {t("tradeMastersImport.importExcel")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => setShowRelationForm(true)}
                    >
                      {t("partyProfile.addRelatedParties")}
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="party-profile__list-section">
                {profile.relatedParties.length === 0 ? (
                  <p className="party-profile__list-empty">
                    {t("partyProfile.noRelated")}{" "}
                    <button
                      type="button"
                      className="party-profile-link party-profile-link--btn"
                      onClick={() => setImportKind("related_parties")}
                    >
                      {t("tradeMastersImport.importExcel")}
                    </button>
                  </p>
                ) : (
                  <ul className="party-profile__item-list">
                    {profile.relatedParties.map((row) => (
                      <li key={row.id} className="party-profile__item-card">
                        <div className="party-profile__item-head">
                          <span className="party-profile__item-label">
                            {row.relatedPartyName}
                            <code className="dash__code party-profile__inline-code">
                              {row.relatedPartyCode}
                            </code>
                          </span>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--danger"
                            disabled={saving}
                            onClick={() => row.id && void handleRemoveRelation(row.id)}
                          >
                            {t("partyProfile.remove")}
                          </button>
                        </div>
                        <p className="party-profile__item-meta">
                          {relationshipLabel(row.relationshipType, t)}
                          {row.clientAlias ? (
                            <>
                              {" · "}
                              <span className="party-profile__client-alias">{row.clientAlias}</span>
                            </>
                          ) : null}
                          {row.notes ? ` · ${row.notes}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {showRelationForm ? (
                <form className="party-profile__add-form" onSubmit={handleAddRelations}>
                  <header className="party-profile__add-head">
                    <h3 className="party-profile__add-title">{t("partyProfile.addRelatedParties")}</h3>
                  </header>
                  <div className="party-profile__form-grid">
                    <div className="field field--span-12">
                      <label className="field__label" htmlFor="related-parties">
                        {t("partyProfile.relatedParties")} <span className="field__req">*</span>
                      </label>
                      <EntitySearchPicker
                        id="related-parties"
                        multiple
                        value={selectedPartyIds}
                        onChange={setSelectedPartyIds}
                        onSearch={searchParties}
                        searchFields={partySearchFields}
                        excludeIds={[...(partyId ? [partyId] : []), ...linkedPartyIds]}
                        placeholder={t("partyProfile.searchParties")}
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="related-type">
                        {t("partyProfile.relatedPartyRole")}
                      </label>
                      <select
                        id="related-type"
                        className="field__input"
                        value={relationDraft.relationshipType}
                        onChange={(e) =>
                          setRelationDraft((d) => ({ ...d, relationshipType: e.target.value }))
                        }
                      >
                        <optgroup label={t("partyProfile.relatedRoleGroupOperational")}>
                          {PARTY_ROLES.map((type) => (
                            <option key={type} value={type}>
                              {roleLabel(type, t)}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label={t("partyProfile.relatedRoleGroupCorporate")}>
                          {CORPORATE_RELATION_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {t(`partyProfile.relationship.${type}`)}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="related-client-alias">
                        {t("partyProfile.clientAliasLabel")}
                      </label>
                      <input
                        id="related-client-alias"
                        className="field__input"
                        value={relationDraft.clientAlias}
                        onChange={(e) => setRelationDraft((d) => ({ ...d, clientAlias: e.target.value }))}
                        placeholder={t("partyProfile.clientAliasPlaceholder")}
                      />
                    </div>
                    <div className="field field--span-4">
                      <label className="field__label" htmlFor="related-notes">
                        {t("partyProfile.notes")}
                      </label>
                      <input
                        id="related-notes"
                        className="field__input"
                        value={relationDraft.notes}
                        onChange={(e) => setRelationDraft((d) => ({ ...d, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="party-profile__form-actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saving || selectedPartyIds.length === 0}
                    >
                      {saving
                        ? t("partyProfile.saving")
                        : t("partyProfile.linkSelected", { count: selectedPartyIds.length })}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={saving}
                      onClick={() => {
                        setRelationDraft({ ...EMPTY_RELATION });
                        setSelectedPartyIds([]);
                        setShowRelationForm(false);
                      }}
                    >
                      {t("partyProfile.cancel")}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <TradeMastersImportModal
        open={importKind !== null}
        kind={importKind ?? "related_parties"}
        onClose={() => setImportKind(null)}
        onImportSuccess={() => void load()}
      />
    </section>
  );
}
