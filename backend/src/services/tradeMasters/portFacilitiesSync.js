import { LOCATION_CATALOG } from "../../data/locations.js";
import { Facility } from "../../models/Facility.js";
import { facilityCodeFromCatalogLocation } from "../../../../shared/domain/facilityCode.js";

const PORT_LOCATIONS = LOCATION_CATALOG.filter((row) => row.kind === "port");

/**
 * Ensures every port in the location catalog exists as a company facility.
 * Facility code: 2 country + 3 location + TRM (e.g. ESVCITRM for Valencia).
 * locationCode stores the UN/LOCODE reference (e.g. ESVLC).
 */
export async function syncPortFacilitiesFromCatalog(companyId) {
  if (PORT_LOCATIONS.length === 0) return { inserted: 0, updated: 0 };

  const ops = PORT_LOCATIONS.map((loc) => {
    const facilityCode = facilityCodeFromCatalogLocation(loc);
    return {
      updateOne: {
        filter: {
          companyId,
          catalogSource: "unloc",
          $or: [{ locationCode: loc.code }, { code: loc.code }, { code: facilityCode }],
        },
        update: {
          $set: {
            code: facilityCode,
            name: loc.name,
            facilityType: "port",
            locationCode: loc.code,
            city: loc.name,
            country: loc.country,
            notes: "Port terminal (TRM)",
            isActive: true,
          },
          $setOnInsert: {
            companyId,
            catalogSource: "unloc",
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Facility.bulkWrite(ops, { ordered: false });
  return {
    inserted: result.upsertedCount ?? 0,
    updated: result.modifiedCount ?? 0,
  };
}
