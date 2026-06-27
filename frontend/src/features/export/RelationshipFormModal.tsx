import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import * as facilitiesApi from "../../api/facilities";
import * as partiesApi from "../../api/parties";
import type { FacilityRelationshipRow, PartyRelationshipRow } from "../../api/tradeRelationships";
import { EntitySearchPicker } from "../../components/EntitySearchPicker";
import { Modal } from "../../components/Modal";
import { messageFromApiErrorOrKey } from "../../i18n/apiMessage.js";
import { useAppTranslation } from "../../i18n/useAppTranslation";
import { EMPTY_FACILITY_LINK, EMPTY_RELATION, PARTY_ROLES } from "./partyProfile/constants";
import { roleLabel } from "./partyProfile/utils";
import {
  saveFacilityRelationshipForm,
  savePartyRelationshipForm,
  type FacilityRelationshipFormInput,
  type PartyRelationshipFormInput,
} from "./relationshipMutations";

export type RelationshipModalMode = "add" | "edit";

type Scope = "party" | "facility";

type RelationshipFormModalProps = {
  open: boolean;
  mode: RelationshipModalMode;
  initialScope?: Scope;
  partyRow?: PartyRelationshipRow | null;
  facilityRow?: FacilityRelationshipRow | null;
  onClose: () => void;
  onSaved: () => void;
};

function RoleSelect({
  id,
  label,
  value,
  onChange,
  required,
  t,
}: {
  id: string;
  label: string;
  value: (typeof PARTY_ROLES)[number];
  onChange: (value: (typeof PARTY_ROLES)[number]) => void;
  required?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="field field--span-6">
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <>
            {" "}
            <span className="field__req">*</span>
          </>
        ) : null}
      </label>
      <select
        id={id}
        className="field__input"
        value={value}
        onChange={(e) => onChange(e.target.value as (typeof PARTY_ROLES)[number])}
      >
        {PARTY_ROLES.map((type) => (
          <option key={type} value={type}>
            {roleLabel(type, t)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RelationshipFormModal({
  open,
  mode,
  initialScope = "party",
  partyRow,
  facilityRow,
  onClose,
  onSaved,
}: RelationshipFormModalProps) {
  const { t } = useAppTranslation();
  const [primaryPartyId, setPrimaryPartyId] = useState("");
  const [linkedPartyId, setLinkedPartyId] = useState("");
  const [primaryRole, setPrimaryRole] = useState<(typeof PARTY_ROLES)[number]>(PARTY_ROLES[0]);
  const [linkedRole, setLinkedRole] = useState<(typeof PARTY_ROLES)[number]>(
    EMPTY_RELATION.relationshipType as (typeof PARTY_ROLES)[number]
  );
  const [clientAlias, setClientAlias] = useState("");
  const [notes, setNotes] = useState("");
  const [facilityId, setFacilityId] = useState("");
  const [aliasRole, setAliasRole] = useState<(typeof PARTY_ROLES)[number]>(PARTY_ROLES[0]);
  const [aliasCode, setAliasCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = mode === "edit";
  const editingParty = isEdit && !!partyRow;
  const editingFacility = isEdit && !!facilityRow;
  const scope: Scope = editingFacility ? "facility" : editingParty ? "party" : initialScope;
  const partyKind = editingParty ? partyRow!.kind : "related";
  const linkId = partyRow?.linkId ?? facilityRow?.linkId;
  const subsidiaryReadOnly = editingParty && partyKind === "subsidiary";
  const aliasEdit = editingParty && partyKind === "alias";

  useEffect(() => {
    if (!open) return;
    setError("");

    if (mode === "edit" && partyRow) {
      setPrimaryPartyId(partyRow.fromPartyId);
      setLinkedPartyId(partyRow.toPartyId ?? "");
      setPrimaryRole((partyRow.primaryRole as (typeof PARTY_ROLES)[number]) || PARTY_ROLES[0]);
      setLinkedRole(
        (partyRow.relationshipType as (typeof PARTY_ROLES)[number]) ||
          (EMPTY_RELATION.relationshipType as (typeof PARTY_ROLES)[number])
      );
      setClientAlias(partyRow.clientAlias);
      setAliasRole((partyRow.aliasRole as (typeof PARTY_ROLES)[number]) || PARTY_ROLES[0]);
      setAliasCode(partyRow.aliasCode || partyRow.clientAlias);
      setNotes(partyRow.notes);
      return;
    }

    if (mode === "edit" && facilityRow) {
      setPrimaryPartyId(facilityRow.partyId);
      setFacilityId(facilityRow.facilityId);
      setPrimaryRole((facilityRow.primaryRole as (typeof PARTY_ROLES)[number]) || PARTY_ROLES[0]);
      setClientAlias(facilityRow.notes);
      setNotes(facilityRow.notes);
      return;
    }

    setPrimaryPartyId("");
    setLinkedPartyId("");
    setPrimaryRole(PARTY_ROLES[0]);
    setLinkedRole(EMPTY_RELATION.relationshipType as (typeof PARTY_ROLES)[number]);
    setClientAlias("");
    setNotes("");
    setFacilityId("");
    setAliasRole(PARTY_ROLES[0]);
    setAliasCode("");
  }, [open, mode, partyRow, facilityRow]);

  const searchParties = useCallback(async (query: string) => {
    const rows = await partiesApi.fetchParties({ q: query, limit: 50 });
    return rows.map((p) => ({
      id: p.id,
      label: p.legalName,
      meta: p.code,
    }));
  }, []);

  const searchOperationalParties = useCallback(async (query: string) => {
    const rows = await partiesApi.fetchParties({ q: query, limit: 50 });
    return rows
      .filter((p) => (p.accountTier ?? "operational") === "operational")
      .map((p) => ({
        id: p.id,
        label: p.legalName,
        meta: p.code,
      }));
  }, []);

  const searchFacilities = useCallback(async (query: string) => {
    const rows = await facilitiesApi.fetchFacilities({ q: query, limit: 50 });
    return rows
      .filter((f) => f.isActive !== false)
      .map((f) => ({
        id: f.id,
        label: f.name,
        meta: f.code,
      }));
  }, []);

  const linkedPartyExclude = useMemo(() => (primaryPartyId ? [primaryPartyId] : []), [primaryPartyId]);
  const primaryPartyExclude = useMemo(() => (linkedPartyId ? [linkedPartyId] : []), [linkedPartyId]);

  const modalTitle = isEdit ? t("relationships.editTitle") : t("relationships.addTitle");
  const isPartyForm = scope === "party";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (subsidiaryReadOnly) return;

    setSaving(true);
    setError("");
    try {
      if (!isPartyForm) {
        if (!primaryPartyId || !facilityId) {
          setError(t("relationships.errRequiredFields"));
          return;
        }
        const input: FacilityRelationshipFormInput = {
          partyId: primaryPartyId,
          facilityId,
          primaryRole,
          purpose: facilityRow?.purpose ?? EMPTY_FACILITY_LINK.purpose,
          notes: clientAlias.trim(),
          linkId: linkId || undefined,
        };
        await saveFacilityRelationshipForm(input);
      } else if (aliasEdit) {
        if (!primaryPartyId || !aliasCode.trim()) {
          setError(t("relationships.errAliasCodeRequired"));
          return;
        }
        const input: PartyRelationshipFormInput = {
          kind: "alias",
          fromPartyId: primaryPartyId,
          toPartyId: "",
          primaryRole,
          relationshipType: aliasRole,
          clientAlias: "",
          aliasRole,
          aliasCode,
          notes,
          linkId: linkId || undefined,
        };
        await savePartyRelationshipForm(input);
      } else {
        if (!primaryPartyId) {
          setError(t("relationships.errPrimaryPartyRequired"));
          return;
        }
        if (!linkedPartyId) {
          setError(t("relationships.errSubsidiaryRequired"));
          return;
        }
        const input: PartyRelationshipFormInput = {
          kind: partyKind === "subsidiary" ? "subsidiary" : "related",
          fromPartyId: primaryPartyId,
          toPartyId: linkedPartyId,
          primaryRole,
          relationshipType: linkedRole,
          clientAlias,
          aliasRole,
          aliasCode: "",
          notes,
          linkId: linkId || undefined,
        };
        await savePartyRelationshipForm(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "relationships.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      closeLabel={t("partyProfile.cancel")}
      className="app-modal--wide"
    >
      <form className="party-profile__edit-form" onSubmit={handleSubmit}>
        {error ? (
          <p className="panel__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="party-profile__form-grid">
          {isPartyForm && !aliasEdit ? (
            <>
              <div className="field field--span-12">
                <label className="field__label" htmlFor="rel-primary-party">
                  {t("relationships.primaryParty")} <span className="field__req">*</span>
                </label>
                <EntitySearchPicker
                  id="rel-primary-party"
                  value={primaryPartyId}
                  onChange={setPrimaryPartyId}
                  onSearch={searchParties}
                  excludeIds={primaryPartyExclude}
                  disabled={isEdit}
                  minQueryLength={0}
                  hideTypeHint
                  valueLabel={partyRow?.fromPartyName}
                />
              </div>

              {!subsidiaryReadOnly ? (
                <RoleSelect
                  id="rel-primary-role"
                  label={t("relationships.primaryRole")}
                  value={primaryRole}
                  onChange={setPrimaryRole}
                  required
                  t={t}
                />
              ) : null}

              {!subsidiaryReadOnly ? (
                <div className="field field--span-12">
                  <label className="field__label" htmlFor="rel-linked-party">
                    {t("relationships.subsidiaryParty")} <span className="field__req">*</span>
                  </label>
                  <EntitySearchPicker
                    id="rel-linked-party"
                    value={linkedPartyId}
                    onChange={setLinkedPartyId}
                    onSearch={searchOperationalParties}
                    excludeIds={linkedPartyExclude}
                    disabled={isEdit}
                    minQueryLength={0}
                    hideTypeHint
                    valueLabel={partyRow?.toPartyName}
                  />
                </div>
              ) : null}

              {!subsidiaryReadOnly ? (
                <>
                  <RoleSelect
                    id="rel-linked-role"
                    label={t("relationships.subsidiaryRole")}
                    value={linkedRole}
                    onChange={setLinkedRole}
                    required
                    t={t}
                  />
                  <div className="field field--span-6">
                    <label className="field__label" htmlFor="rel-client-alias">
                      {t("relationships.clientAliasOptional")}
                    </label>
                    <input
                      id="rel-client-alias"
                      className="field__input"
                      value={clientAlias}
                      onChange={(e) => setClientAlias(e.target.value)}
                    />
                  </div>
                </>
              ) : null}

              {subsidiaryReadOnly ? (
                <div className="field field--span-12">
                  <p className="panel__muted">
                    {partyRow?.toPartyName}{" "}
                    <code className="trade-setup-alias-code">{partyRow?.toPartyCode}</code>
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          {isPartyForm && aliasEdit ? (
            <>
              <div className="field field--span-12">
                <label className="field__label">{t("relationships.primaryParty")}</label>
                <p className="panel__muted">{partyRow?.fromPartyName}</p>
              </div>
              <RoleSelect
                id="rel-alias-role"
                label={t("relationships.role")}
                value={aliasRole}
                onChange={setAliasRole}
                t={t}
              />
              <div className="field field--span-6">
                <label className="field__label" htmlFor="rel-alias-code">
                  {t("relationships.aliasCode")} <span className="field__req">*</span>
                </label>
                <input
                  id="rel-alias-code"
                  className="field__input"
                  value={aliasCode}
                  onChange={(e) => setAliasCode(e.target.value)}
                  required
                />
              </div>
            </>
          ) : null}

          {!isPartyForm ? (
            <>
              <div className="field field--span-12">
                <label className="field__label" htmlFor="rel-primary-party-facility">
                  {t("relationships.primaryParty")} <span className="field__req">*</span>
                </label>
                <EntitySearchPicker
                  id="rel-primary-party-facility"
                  value={primaryPartyId}
                  onChange={setPrimaryPartyId}
                  onSearch={searchParties}
                  disabled={isEdit}
                  minQueryLength={0}
                  hideTypeHint
                  valueLabel={facilityRow?.partyName}
                />
              </div>
              <RoleSelect
                id="rel-facility-primary-role"
                label={t("relationships.primaryRole")}
                value={primaryRole}
                onChange={setPrimaryRole}
                required
                t={t}
              />
              <div className="field field--span-12">
                <label className="field__label" htmlFor="rel-facility">
                  {t("facilityRelationships.thFacility")} <span className="field__req">*</span>
                </label>
                <EntitySearchPicker
                  id="rel-facility"
                  value={facilityId}
                  onChange={setFacilityId}
                  onSearch={searchFacilities}
                  disabled={isEdit}
                  minQueryLength={0}
                  hideTypeHint
                  valueLabel={facilityRow?.facilityName}
                />
              </div>
              <div className="field field--span-12">
                <label className="field__label" htmlFor="rel-facility-alias">
                  {t("relationships.clientAliasOptional")}
                </label>
                <input
                  id="rel-facility-alias"
                  className="field__input"
                  value={clientAlias}
                  onChange={(e) => setClientAlias(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="party-profile__form-actions">
          {!subsidiaryReadOnly ? (
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? t("partyProfile.saving") : t("partyProfile.save")}
            </button>
          ) : null}
          <button type="button" className="btn btn--ghost" disabled={saving} onClick={onClose}>
            {t("partyProfile.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
