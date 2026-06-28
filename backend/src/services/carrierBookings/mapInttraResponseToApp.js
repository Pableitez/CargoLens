/**
 * Normalizes INTTRA (or mock) responses into app-level fields.
 */
export function mapInttraResponseToApp(raw) {
  const status = String(raw?.status ?? raw?.bookingStatus ?? "")
    .trim()
    .toUpperCase();
  const externalReference = String(
    raw?.carrierBookingReference ?? raw?.bookingReference ?? raw?.externalReference ?? ""
  ).trim();
  const transactionId = String(raw?.transactionId ?? raw?.inttraTransactionId ?? "").trim();

  let nextStatus = "acknowledged";
  if (status === "CONFIRMED" || status === "ACCEPTED") nextStatus = "confirmed";
  else if (status === "REJECTED" || status === "DECLINED") nextStatus = "rejected";
  else if (status === "FAILED" || status === "ERROR") nextStatus = "failed";

  return {
    status: nextStatus,
    externalReference,
    externalStatus: status || "ACKNOWLEDGED",
    inttraTransactionId: transactionId,
    rejectionReason: String(raw?.rejectionReason ?? raw?.message ?? "").trim(),
    acknowledgedAt: raw?.receivedAt ? new Date(raw.receivedAt) : new Date(),
    confirmedAt: nextStatus === "confirmed" ? new Date() : null,
    rejectedAt: nextStatus === "rejected" || nextStatus === "failed" ? new Date() : null,
  };
}
