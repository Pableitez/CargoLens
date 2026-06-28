import { CompanyBookingCounter } from "../models/CompanyBookingCounter.js";

const LEGACY_COUNTER_INDEX = "companyId_1_year_1";

/** Drop pre-kind unique index so shipper + carrier counters can coexist per company/year. */
export async function migrateCompanyBookingCounters() {
  const collection = CompanyBookingCounter.collection;
  const indexes = await collection.indexes();
  const hasLegacy = indexes.some((idx) => idx.name === LEGACY_COUNTER_INDEX);

  if (hasLegacy) {
    await collection.dropIndex(LEGACY_COUNTER_INDEX);
    console.log(`[db] Dropped legacy CompanyBookingCounter index (${LEGACY_COUNTER_INDEX})`);
  }

  await CompanyBookingCounter.updateMany(
    { $or: [{ kind: { $exists: false } }, { kind: null }, { kind: "" }] },
    { $set: { kind: "shipper" } }
  );

  await CompanyBookingCounter.syncIndexes();
}
