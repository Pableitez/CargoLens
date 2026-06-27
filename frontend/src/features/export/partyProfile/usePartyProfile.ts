import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { parseBeCode, suggestBeCode } from "@shared/domain/beCode.js";
import { resolveIsoCountryCode } from "@shared/domain/isoCountries.js";
import { normalizePartyVat } from "@shared/domain/partyVat.js";
import * as clientsApi from "../../../api/clients.js";
import * as facilitiesApi from "../../../api/facilities";
import * as partiesApi from "../../../api/parties";
import * as supplyChainsApi from "../../../api/supplyChains";
import { useAuth } from "../../../contexts/AuthContext";
import { messageFromApiErrorOrKey } from "../../../i18n/apiMessage.js";
import { useAppTranslation } from "../../../i18n/useAppTranslation";
import {
  ClientRow,
  EMPTY_ADDRESS,
  EMPTY_CHAIN,
  EMPTY_CONTACT,
  EMPTY_FACILITY_LINK,
  EMPTY_RELATION,
  ProfileSection,
  type HubChainForm,
} from "./constants";
import { tradeSetupFacilitiesPath, tradeSetupPartiesPath } from "../tradeSetupPaths";

function deriveChainCode(name: string, direction: string) {
  const slug = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
  const dir = direction.toUpperCase().slice(0, 3);
  return (slug ? `${slug}-${dir}` : dir).slice(0, 40);
}

function identityFieldsFromParty(item: partiesApi.PartyProfile) {
  const parsed = parseBeCode(item.code);
  return {
    legalName: item.legalName,
    code: item.code,
    country: resolveIsoCountryCode(item.country) || parsed?.country || "",
    functionCode: parsed?.functionCode ?? "HQ",
    city: item.city,
    address: item.address,
    vat: item.vat,
    notes: item.notes,
    accountTier: item.accountTier === "contractual" ? ("contractual" as const) : ("operational" as const),
  };
}

export function usePartyProfile() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, locale } = useAppTranslation();
  const { user } = useAuth();
  const isClientPortal = !!user?.isClientPortal;
  const tradeBase = tradeSetupPartiesPath(isClientPortal);
  const facilitiesBase = tradeSetupFacilitiesPath(isClientPortal);

  const portalClient = useMemo<ClientRow | null>(() => {
    if (!isClientPortal || !user?.clientId) return null;
    const primaryId = user.primaryClientId ? String(user.primaryClientId) : String(user.clientId);
    return {
      id: primaryId,
      name: user.primaryClientName ?? user.clientName ?? t("tradeSetup.yourAccount"),
      code: user.primaryClientCode ?? user.clientCode ?? "",
    };
  }, [isClientPortal, user, t]);

  const [profile, setProfile] = useState<partiesApi.PartyProfile | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [section, setSection] = useState<ProfileSection>(() =>
    searchParams.get("section") === "chains" ? "chains" : "identity"
  );
  const [showHubForm, setShowHubForm] = useState(false);
  const [editingHubId, setEditingHubId] = useState<string | null>(null);
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [showSubsidiaryForm, setShowSubsidiaryForm] = useState(false);
  const [selectedSubsidiaryIds, setSelectedSubsidiaryIds] = useState<string[]>([]);
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [selectedPartyIds, setSelectedPartyIds] = useState<string[]>([]);
  const [hubForm, setHubForm] = useState<HubChainForm>(EMPTY_CHAIN);
  const [identityForm, setIdentityForm] = useState({
    legalName: "",
    code: "",
    country: "",
    functionCode: "HQ",
    city: "",
    address: "",
    vat: "",
    notes: "",
    accountTier: "operational" as "operational" | "contractual",
  });
  const [identityCodeTouched, setIdentityCodeTouched] = useState(false);
  const [addressDraft, setAddressDraft] = useState({ ...EMPTY_ADDRESS });
  const [contactDraft, setContactDraft] = useState({ ...EMPTY_CONTACT });
  const [relationDraft, setRelationDraft] = useState({ ...EMPTY_RELATION });
  const [facilityDraft, setFacilityDraft] = useState({ ...EMPTY_FACILITY_LINK });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const applyProfile = useCallback((item: partiesApi.PartyProfile) => {
    setProfile(item);
    setIdentityForm(identityFieldsFromParty(item));
    setIdentityCodeTouched(false);
  }, []);

  const load = useCallback(async () => {
    if (!partyId) return;
    setLoading(true);
    setError("");
    try {
      const item = await partiesApi.fetchPartyProfile(partyId);
      applyProfile(item);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "partyProfile.loadFailed"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [applyProfile, partyId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("section") === "chains") {
      setSection("chains");
    }
  }, [searchParams]);

  const closeAllForms = useCallback(() => {
    setEditingIdentity(false);
    setShowAddressForm(false);
    setShowContactForm(false);
    setShowRelationForm(false);
    setShowFacilityForm(false);
    setShowSubsidiaryForm(false);
    setShowHubForm(false);
    setEditingHubId(null);
  }, []);

  const handleSectionChange = useCallback(
    (next: ProfileSection) => {
      closeAllForms();
      setSection(next);
      requestAnimationFrame(() => {
        document
          .getElementById("party-profile-content")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [closeAllForms]
  );

  const cancelIdentityEdit = useCallback(() => {
    if (!profile) return;
    setIdentityForm(identityFieldsFromParty(profile));
    setIdentityCodeTouched(false);
    setEditingIdentity(false);
  }, [profile]);

  useEffect(() => {
    if (editingIdentity) setIdentityCodeTouched(true);
  }, [editingIdentity]);

  useEffect(() => {
    if (!editingIdentity || identityCodeTouched) return;
    const suggested = suggestBeCode({
      country: identityForm.country,
      legalName: identityForm.legalName,
      functionCode: identityForm.functionCode,
    });
    if (suggested) {
      setIdentityForm((f) => (f.code === suggested ? f : { ...f, code: suggested }));
    }
  }, [
    editingIdentity,
    identityCodeTouched,
    identityForm.country,
    identityForm.legalName,
    identityForm.functionCode,
    identityForm.code,
  ]);

  useEffect(() => {
    if (section !== "chains" && section !== "identity") return;
    if (isClientPortal && portalClient) {
      setClients([portalClient]);
      setHubForm((f) => (f.clientId ? f : { ...f, clientId: portalClient.id }));
      return;
    }
    clientsApi
      .fetchClients()
      .then((rows) =>
        setClients(
          rows.map((c: { id: string; name: string; code?: string; contractualTier?: string }) => ({
            id: c.id,
            name: c.name,
            code: c.code ?? "",
            contractualTier: c.contractualTier ?? "primary",
          }))
        )
      )
      .catch(() => {});
  }, [section, isClientPortal, portalClient]);

  const partySearchFields = useMemo(
    () => [
      { id: "legalName", label: t("partyField.party") },
      { id: "code", label: t("partyField.beCode") },
      { id: "vat", label: t("parties.thVat") },
      { id: "country", label: t("tradeSetup.partyCountry") },
      { id: "city", label: t("partyProfile.city") },
      { id: "address", label: t("partyProfile.address") },
    ],
    [t]
  );

  const facilitySearchFields = useMemo(
    () => [
      { id: "name", label: t("facilities.fieldName") },
      { id: "code", label: t("facilities.fieldCode") },
      { id: "locationCode", label: t("facilities.thUnloc") },
      { id: "city", label: t("partyProfile.city") },
      { id: "country", label: t("tradeSetup.partyCountry") },
      { id: "line1", label: t("facilities.fieldAddress") },
    ],
    [t]
  );

  const searchParties = useCallback(
    async (query: string, field?: string) => {
      const rows = await partiesApi.fetchParties({ q: query, field, limit: 50 });
      return rows
        .filter((p) => p.id !== partyId)
        .map((p) => ({
          id: p.id,
          label: p.legalName,
          meta: p.code,
        }));
    },
    [partyId]
  );

  const searchFacilities = useCallback(async (query: string, field?: string) => {
    const rows = await facilitiesApi.fetchFacilities({ q: query, field, limit: 50 });
    return rows
      .filter((f) => f.isActive !== false)
      .map((f) => ({
        id: f.id,
        label: f.name,
        meta: f.locationCode || f.code,
      }));
  }, []);

  const primaryClients = useMemo(
    () => clients.filter((c) => (c.contractualTier ?? "primary") === "primary"),
    [clients]
  );

  const linkedPartyIds = useMemo(
    () => new Set((profile?.relatedParties ?? []).map((row) => row.relatedPartyId)),
    [profile?.relatedParties]
  );

  const linkedFacilityIds = useMemo(
    () => new Set((profile?.relatedFacilities ?? []).map((row) => row.facilityId)),
    [profile?.relatedFacilities]
  );

  const linkedSubsidiaryIds = useMemo(
    () => new Set((profile?.subsidiaries ?? []).map((row) => row.id)),
    [profile?.subsidiaries]
  );

  const isClientParty = profile?.accountTier === "contractual";
  const isPrimaryClient = isClientParty && (profile?.contractualTier ?? "primary") === "primary";
  const isSubsidiaryClient = isClientParty && !isPrimaryClient;

  const sections = useMemo(() => {
    const counts = profile?.sectionCounts;
    const showSubsidiariesSection = !isClientPortal && !isSubsidiaryClient;
    return [
      { id: "identity" as const, label: t("partyProfile.sectionIdentity"), count: null },
      ...(showSubsidiariesSection
        ? [
            {
              id: "subsidiaries" as const,
              label: t("partyProfile.sectionSubsidiaries"),
              count: counts?.subsidiaries ?? 0,
            },
          ]
        : []),
      { id: "chains" as const, label: t("partyProfile.sectionChains"), count: counts?.supplyChains ?? 0 },
      { id: "addresses" as const, label: t("partyProfile.sectionAddresses"), count: counts?.addresses ?? 0 },
      { id: "contacts" as const, label: t("partyProfile.sectionContacts"), count: counts?.contacts ?? 0 },
      {
        id: "facilities" as const,
        label: t("partyProfile.sectionFacilities"),
        count: counts?.relatedFacilities ?? 0,
      },
      { id: "related" as const, label: t("partyProfile.sectionRelated"), count: counts?.relatedParties ?? 0 },
    ];
  }, [isClientPortal, isSubsidiaryClient, profile, t]);

  const persistUpdate = useCallback(
    async (body: partiesApi.PartyProfileUpdate) => {
      if (!partyId) return false;
      setSaving(true);
      setError("");
      try {
        const item = await partiesApi.updateParty(partyId, body);
        applyProfile(item);
        return true;
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, t, "partyProfile.saveFailed"));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [applyProfile, partyId, t]
  );

  const handleSaveIdentity = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const payload: partiesApi.PartyProfileUpdate = {
        legalName: identityForm.legalName,
        code: identityForm.code,
        country: identityForm.country,
        city: identityForm.city,
        address: identityForm.address,
        vat: identityForm.vat,
        notes: identityForm.notes,
      };

      if (!isClientPortal) {
        payload.accountTier = identityForm.accountTier;
      }

      if (await persistUpdate(payload)) {
        setEditingIdentity(false);
      }
    },
    [identityForm, isClientPortal, persistUpdate]
  );

  const handleAddAddress = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || !addressDraft.line1.trim()) return;
      const next = [...profile.addressBook, { ...addressDraft, line1: addressDraft.line1.trim() }];
      if (await persistUpdate({ addressBook: next })) {
        setAddressDraft({ ...EMPTY_ADDRESS });
        setShowAddressForm(false);
      }
    },
    [addressDraft, persistUpdate, profile]
  );

  const handleRemoveAddress = useCallback(
    async (id: string) => {
      if (!profile) return;
      await persistUpdate({ addressBook: profile.addressBook.filter((row) => row.id !== id) });
    },
    [persistUpdate, profile]
  );

  const handleAddContact = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || !contactDraft.name.trim()) return;
      if (
        await persistUpdate({
          contacts: [...profile.contacts, { ...contactDraft, name: contactDraft.name.trim() }],
        })
      ) {
        setContactDraft({ ...EMPTY_CONTACT });
        setShowContactForm(false);
      }
    },
    [contactDraft, persistUpdate, profile]
  );

  const handleRemoveContact = useCallback(
    async (id: string) => {
      if (!profile) return;
      await persistUpdate({ contacts: profile.contacts.filter((row) => row.id !== id) });
    },
    [persistUpdate, profile]
  );

  const handleAddRelations = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || selectedPartyIds.length === 0) return;
      const existing = new Set(profile.relatedParties.map((row) => row.relatedPartyId));
      const toAdd = selectedPartyIds.filter((id) => !existing.has(id));
      if (toAdd.length === 0) return;
      if (
        await persistUpdate({
          relatedParties: [
            ...profile.relatedParties,
            ...toAdd.map((relatedPartyId) => ({
              relatedPartyId,
              relationshipType: relationDraft.relationshipType,
              clientAlias: relationDraft.clientAlias.trim(),
              notes: relationDraft.notes,
            })),
          ],
        })
      ) {
        setRelationDraft({ ...EMPTY_RELATION });
        setSelectedPartyIds([]);
        setShowRelationForm(false);
      }
    },
    [persistUpdate, profile, relationDraft, selectedPartyIds]
  );

  const handleRemoveRelation = useCallback(
    async (id: string) => {
      if (!profile) return;
      await persistUpdate({ relatedParties: profile.relatedParties.filter((row) => row.id !== id) });
    },
    [persistUpdate, profile]
  );

  const handleAddFacilityLinks = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || selectedFacilityIds.length === 0) return;
      const existing = new Set((profile.relatedFacilities ?? []).map((row) => row.facilityId));
      const toAdd = selectedFacilityIds.filter((id) => !existing.has(id));
      if (toAdd.length === 0) return;
      if (
        await persistUpdate({
          relatedFacilities: [
            ...(profile.relatedFacilities ?? []),
            ...toAdd.map((facilityId) => ({
              facilityId,
              purpose: facilityDraft.purpose,
              notes: facilityDraft.notes,
            })),
          ],
        })
      ) {
        setFacilityDraft({ ...EMPTY_FACILITY_LINK });
        setSelectedFacilityIds([]);
        setShowFacilityForm(false);
      }
    },
    [facilityDraft, persistUpdate, profile, selectedFacilityIds]
  );

  const handleRemoveFacilityLink = useCallback(
    async (id: string) => {
      if (!profile) return;
      await persistUpdate({
        relatedFacilities: (profile.relatedFacilities ?? []).filter((row) => row.id !== id),
      });
    },
    [persistUpdate, profile]
  );

  const handleAddSubsidiaries = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!profile || selectedSubsidiaryIds.length === 0) return;
      const existing = new Set((profile.subsidiaries ?? []).map((row) => row.id));
      const toAdd = selectedSubsidiaryIds.filter((id) => !existing.has(id));
      if (toAdd.length === 0) return;
      if (await persistUpdate({ addSubsidiaryPartyIds: toAdd })) {
        setSelectedSubsidiaryIds([]);
        setShowSubsidiaryForm(false);
      }
    },
    [persistUpdate, profile, selectedSubsidiaryIds]
  );

  const handleRemoveSubsidiary = useCallback(
    async (subsidiaryId: string) => {
      if (!profile) return;
      const label = profile.subsidiaries?.find((row) => row.id === subsidiaryId)?.legalName ?? subsidiaryId;
      if (!window.confirm(t("partyProfile.confirmRemoveSubsidiary", { name: label }))) return;
      await persistUpdate({ removeSubsidiaryPartyIds: [subsidiaryId] });
    },
    [persistUpdate, profile, t]
  );

  const searchSubsidiaryCandidates = useCallback(
    async (query: string, field?: string) => {
      const rows = await partiesApi.fetchParties({ q: query, field, limit: 50 });
      return rows
        .filter((p) => p.id !== partyId)
        .filter((p) => !linkedSubsidiaryIds.has(p.id))
        .filter((p) => (p.accountTier ?? "operational") === "operational")
        .map((p) => ({
          id: p.id,
          label: p.legalName,
          meta: p.code,
        }));
    },
    [linkedSubsidiaryIds, partyId]
  );

  const handleDeleteParty = useCallback(async () => {
    if (!profile || !partyId) return;
    const label = `${profile.legalName} (${profile.code})`;
    if (!window.confirm(t("parties.deleteConfirm", { name: label }))) return;
    setDeleting(true);
    setError("");
    try {
      await partiesApi.removeParty(partyId);
      navigate(tradeBase);
    } catch (err) {
      setError(messageFromApiErrorOrKey(err, t, "parties.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }, [navigate, partyId, profile, t, tradeBase]);

  const primaryHubs = useMemo(
    () => (profile?.chainMemberships ?? []).filter((row) => row.chainPosition === "primary"),
    [profile]
  );

  const memberChains = useMemo(
    () => (profile?.chainMemberships ?? []).filter((row) => row.chainPosition === "member"),
    [profile]
  );

  const chainCount = profile?.sectionCounts.supplyChains ?? 0;
  const isChainHub = primaryHubs.length > 0;

  const hubClientIds = useMemo(() => new Set(primaryHubs.map((row) => row.clientId)), [primaryHubs]);

  const availableHubClients = useMemo(
    () => primaryClients.filter((c) => !hubClientIds.has(c.id)),
    [primaryClients, hubClientIds]
  );

  const cancelHubForm = useCallback(() => {
    setShowHubForm(false);
    setEditingHubId(null);
    setHubForm(EMPTY_CHAIN);
  }, []);

  const openHubForm = useCallback(
    (chain?: partiesApi.PartyOwnedSupplyChain | partiesApi.PartyChainMembership) => {
      if (chain && "primaryPartyId" in chain) {
        setEditingHubId(chain.chainId);
        setHubForm({
          clientId: partyId ?? "",
          primaryPartyId: chain.primaryPartyId ?? "",
          code: chain.chainCode,
          name: chain.chainName,
          direction: chain.direction ?? "export",
          primaryRole: chain.primaryRole ?? "shipper",
          defaultIncoterm: chain.defaultIncoterm ?? "",
          defaultTransportMode: chain.defaultTransportMode ?? "",
          defaultPortOfLoading: chain.defaultPortOfLoading ?? "",
          defaultPortOfDischarge: chain.defaultPortOfDischarge ?? "",
        });
      } else if (chain) {
        setEditingHubId(chain.chainId);
        setHubForm({
          clientId: chain.clientId ?? partyId ?? "",
          primaryPartyId: chain.hubPartyId ?? partyId ?? "",
          code: chain.chainCode,
          name: chain.chainName,
          direction: chain.direction ?? "export",
          primaryRole: (chain.primaryRole ??
            chain.operationalRole ??
            "shipper") as HubChainForm["primaryRole"],
          defaultIncoterm: chain.defaultIncoterm ?? "",
          defaultTransportMode: chain.defaultTransportMode ?? "",
          defaultPortOfLoading: chain.defaultPortOfLoading ?? "",
          defaultPortOfDischarge: chain.defaultPortOfDischarge ?? "",
        });
      } else {
        setEditingHubId(null);
        setHubForm({
          ...EMPTY_CHAIN,
          clientId: partyId ?? "",
        });
      }
      setShowHubForm(true);
    },
    [partyId]
  );

  const handleSaveHub = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!partyId || !isPrimaryClient) return;
      if (!hubForm.primaryPartyId.trim()) {
        setError(t("partyProfile.errOperationalPartyRequired"));
        return;
      }
      if (!hubForm.name.trim()) return;

      setSaving(true);
      setError("");
      try {
        const code = hubForm.code.trim() || deriveChainCode(hubForm.name, hubForm.direction);
        const payload = {
          ...hubForm,
          code,
          clientId: partyId,
          primaryPartyId: hubForm.primaryPartyId,
        };
        if (editingHubId) {
          await supplyChainsApi.updateSupplyChain(editingHubId, payload);
        } else {
          await supplyChainsApi.createSupplyChain(payload);
        }
        cancelHubForm();
        await load();
      } catch (err) {
        setError(messageFromApiErrorOrKey(err, t, "tradeSetup.chainSaveFailed"));
      } finally {
        setSaving(false);
      }
    },
    [cancelHubForm, editingHubId, hubForm, isPrimaryClient, load, partyId, t]
  );

  const chainPositionCounts = profile?.chainPositionCounts ?? { primary: 0, member: 0 };

  return {
    partyId,
    t,
    locale,
    isClientPortal,
    tradeBase,
    facilitiesBase,
    portalClient,
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
    showSubsidiaryForm,
    selectedFacilityIds,
    setSelectedFacilityIds,
    selectedSubsidiaryIds,
    setSelectedSubsidiaryIds,
    selectedPartyIds,
    setSelectedPartyIds,
    hubForm,
    setHubForm,
    identityForm,
    setIdentityForm,
    onIdentityCodeTouched: () => setIdentityCodeTouched(true),
    onIdentitySuggestReset: () => setIdentityCodeTouched(false),
    addressDraft,
    setAddressDraft,
    contactDraft,
    setContactDraft,
    relationDraft,
    setRelationDraft,
    facilityDraft,
    setFacilityDraft,
    loading,
    load,
    saving,
    deleting,
    error,
    handleSectionChange,
    cancelIdentityEdit,
    searchParties,
    searchFacilities,
    partySearchFields,
    facilitySearchFields,
    primaryClients,
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
    handleAddSubsidiaries,
    handleRemoveSubsidiary,
    searchSubsidiaryCandidates,
    linkedSubsidiaryIds,
    handleDeleteParty,
    isClientParty,
    isPrimaryClient,
    isSubsidiaryClient,
    primaryHubs,
    memberChains,
    chainCount,
    isChainHub,
    availableHubClients,
    cancelHubForm,
    openHubForm,
    handleSaveHub,
    chainPositionCounts,
    setEditingIdentity,
    setShowAddressForm,
    setShowContactForm,
    setShowRelationForm,
    setShowFacilityForm,
    setShowSubsidiaryForm,
  };
}

export type PartyProfileState = ReturnType<typeof usePartyProfile>;
