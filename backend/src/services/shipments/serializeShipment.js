export function serializeShipment(doc, { includeShareLinks = false } = {}) {
  const item = {
    id: doc._id,
    reference: doc.reference,
    origin: doc.origin ?? "",
    destination: doc.destination ?? "",
    etd: doc.etd ?? null,
    eta: doc.eta ?? null,
    status: doc.status,
    notes: doc.notes ?? "",
    clientId: doc.clientId ?? null,
    containers: (doc.containers ?? []).map((c) => ({
      containerNumber: c.containerNumber,
      notes: c.notes ?? "",
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (includeShareLinks && doc.shareLinks) {
    item.shareLinks = doc.shareLinks;
  }

  return item;
}

export function serializePublicShipment(doc, companyName = "", events = []) {
  return {
    reference: doc.reference,
    origin: doc.origin ?? "",
    destination: doc.destination ?? "",
    etd: doc.etd ?? null,
    eta: doc.eta ?? null,
    status: doc.status,
    containers: (doc.containers ?? []).map((c) => ({
      containerNumber: c.containerNumber,
    })),
    companyName: companyName || undefined,
    updatedAt: doc.updatedAt,
    events,
  };
}

export function serializeShareLink(doc, publicUrl) {
  return {
    id: doc._id,
    publicUrl,
    expiresAt: doc.expiresAt ?? null,
    revokedAt: doc.revokedAt ?? null,
    createdAt: doc.createdAt,
  };
}
