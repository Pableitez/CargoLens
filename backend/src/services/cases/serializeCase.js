export function serializeCase(doc) {
  return {
    id: doc._id,
    reference: doc.reference,
    title: doc.title ?? "",
    status: doc.status,
    tradeDirection: doc.tradeDirection ?? "",
    incoterm: doc.incoterm ?? "",
    origin: doc.origin ?? "",
    destination: doc.destination ?? "",
    clientId: doc.clientId ?? null,
    shipmentIds: (doc.shipmentIds ?? []).map((id) => String(id)),
    openedAt: doc.openedAt ?? null,
    closedAt: doc.closedAt ?? null,
    notes: doc.notes ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
