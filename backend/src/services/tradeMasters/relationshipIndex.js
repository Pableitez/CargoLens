export function serializePartyAccountType(party) {
  if (!party || (party.accountTier ?? "operational") !== "contractual") return "operational";
  return (party.contractualTier ?? "primary") === "subsidiary"
    ? "contractual_subsidiary"
    : "contractual_primary";
}

function normalizeQuery(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function rowMatchesQuery(row, q, field) {
  if (!q) return true;
  const haystack =
    field && row[field] !== undefined
      ? [String(row[field] ?? "")]
      : [
          row.fromPartyCode,
          row.fromPartyName,
          row.toPartyCode,
          row.toPartyName,
          row.clientAlias,
          row.aliasCode,
          row.relationshipType,
          row.primaryRole,
          row.notes,
          row.partyCode,
          row.partyName,
          row.facilityCode,
          row.facilityName,
        ];
  return haystack.some((part) => normalizeQuery(part).includes(q));
}

export function buildPartyRelationshipRows(parties) {
  const partyById = new Map(parties.map((p) => [String(p._id), p]));
  const rows = [];

  for (const party of parties) {
    const fromId = String(party._id);
    const fromBase = {
      fromPartyId: fromId,
      fromPartyCode: party.code ?? "",
      fromPartyName: party.legalName ?? "",
      fromAccountType: serializePartyAccountType(party),
    };

    for (const alias of party.aliases ?? []) {
      const aliasCode = alias.aliasCode ?? "";
      rows.push({
        id: `alias:${fromId}:${alias._id ?? aliasCode}:${alias.role ?? ""}`,
        kind: "alias",
        linkId: alias._id ? String(alias._id) : "",
        ...fromBase,
        toPartyId: null,
        toPartyCode: "",
        toPartyName: "",
        toAccountType: "",
        relationshipType: alias.role ?? "",
        clientAlias: aliasCode,
        aliasCode,
        aliasRole: alias.role ?? "",
        notes: alias.source ?? "",
      });
    }

    for (const rel of party.relatedParties ?? []) {
      const toId = String(rel.relatedPartyId ?? "");
      const to = partyById.get(toId);
      rows.push({
        id: `related:${fromId}:${toId}:${rel._id ?? toId}`,
        kind: "related",
        linkId: rel._id ? String(rel._id) : "",
        ...fromBase,
        toPartyId: toId,
        toPartyCode: to?.code ?? "",
        toPartyName: to?.legalName ?? "",
        toAccountType: serializePartyAccountType(to),
        primaryRole: rel.primaryRole ?? "",
        relationshipType: rel.relationshipType ?? "",
        clientAlias: rel.clientAlias ?? "",
        aliasCode: "",
        aliasRole: "",
        notes: rel.notes ?? "",
      });
    }
  }

  for (const party of parties) {
    if (!party.parentPartyId) continue;
    if ((party.accountTier ?? "operational") !== "contractual") continue;
    if ((party.contractualTier ?? "primary") !== "subsidiary") continue;

    const parent = partyById.get(String(party.parentPartyId));
    if (!parent) continue;

    rows.push({
      id: `subsidiary:${party.parentPartyId}:${party._id}`,
      kind: "subsidiary",
      linkId: "",
      fromPartyId: String(party.parentPartyId),
      fromPartyCode: parent.code ?? "",
      fromPartyName: parent.legalName ?? "",
      fromAccountType: serializePartyAccountType(parent),
      toPartyId: String(party._id),
      toPartyCode: party.code ?? "",
      toPartyName: party.legalName ?? "",
      toAccountType: serializePartyAccountType(party),
      relationshipType: "subsidiary",
      clientAlias: "",
      aliasCode: "",
      aliasRole: "",
      notes: "",
    });
  }

  rows.sort((a, b) => {
    const left = `${a.fromPartyName}:${a.kind}:${a.toPartyName}:${a.clientAlias}`;
    const right = `${b.fromPartyName}:${b.kind}:${b.toPartyName}:${b.clientAlias}`;
    return left.localeCompare(right);
  });

  return rows;
}

export function filterPartyRelationshipRows(rows, query = {}) {
  const q = normalizeQuery(query.q);
  const kind = normalizeQuery(query.kind);
  const relationshipType = normalizeQuery(query.relationshipType);
  const fromAccountType = normalizeQuery(query.fromAccountType);
  const toAccountType = normalizeQuery(query.toAccountType);
  const field = String(query.field ?? "").trim();

  return rows.filter((row) => {
    if (kind && kind !== "all" && row.kind !== kind) return false;
    if (relationshipType && relationshipType !== "all" && row.relationshipType !== relationshipType) {
      return false;
    }
    if (fromAccountType && fromAccountType !== "all" && row.fromAccountType !== fromAccountType) {
      return false;
    }
    if (toAccountType && toAccountType !== "all" && row.toAccountType !== toAccountType) {
      return false;
    }
    if (!rowMatchesQuery(row, q, field)) return false;
    return true;
  });
}

export function buildFacilityRelationshipRows(parties, facilities) {
  const facilityById = new Map(facilities.map((f) => [String(f._id), f]));
  const rows = [];

  for (const party of parties) {
    for (const link of party.relatedFacilities ?? []) {
      const facilityId = String(link.facilityId ?? "");
      const facility = facilityById.get(facilityId);
      rows.push({
        id: `facility:${party._id}:${facilityId}:${link._id ?? facilityId}`,
        linkId: link._id ? String(link._id) : "",
        partyId: String(party._id),
        partyCode: party.code ?? "",
        partyName: party.legalName ?? "",
        partyAccountType: serializePartyAccountType(party),
        facilityId,
        facilityCode: facility?.code ?? "",
        facilityName: facility?.name ?? "",
        facilityCity: facility?.city ?? "",
        facilityCountry: facility?.country ?? "",
        primaryRole: link.primaryRole ?? "",
        purpose: link.purpose ?? "",
        notes: link.notes ?? "",
      });
    }
  }

  rows.sort((a, b) => {
    const left = `${a.partyName}:${a.facilityName}:${a.purpose}`;
    const right = `${b.partyName}:${b.facilityName}:${b.purpose}`;
    return left.localeCompare(right);
  });

  return rows;
}

export function filterFacilityRelationshipRows(rows, query = {}) {
  const q = normalizeQuery(query.q);
  const purpose = normalizeQuery(query.purpose);
  const partyAccountType = normalizeQuery(query.partyAccountType);
  const field = String(query.field ?? "").trim();

  return rows.filter((row) => {
    if (purpose && purpose !== "all" && row.purpose !== purpose) return false;
    if (partyAccountType && partyAccountType !== "all" && row.partyAccountType !== partyAccountType) {
      return false;
    }
    if (!rowMatchesQuery(row, q, field)) return false;
    return true;
  });
}

export function paginateRelationshipRows(rows, skip = 0, limit = 100) {
  const safeSkip = Math.max(0, skip);
  const safeLimit = Math.min(Math.max(1, limit), 500);
  const items = rows.slice(safeSkip, safeSkip + safeLimit);
  const total = rows.length;
  return {
    items,
    total,
    skip: safeSkip,
    limit: safeLimit,
    hasMore: safeSkip + items.length < total,
  };
}
