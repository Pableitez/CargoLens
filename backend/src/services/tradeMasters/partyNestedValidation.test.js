import mongoose from "mongoose";
import { validatePartyNestedInput } from "./partyNestedValidation.js";

describe("validatePartyNestedInput", () => {
  const partyId = new mongoose.Types.ObjectId().toString();

  it("accepts valid address book entries", () => {
    const { errors, data } = validatePartyNestedInput(
      {
        addressBook: [
          {
            label: "registered",
            line1: "Carrer Example 1",
            city: "Barcelona",
            country: "Spain",
            isPrimary: true,
          },
        ],
      },
      { partyId, partial: true }
    );
    expect(errors).toEqual([]);
    expect(data.addressBook).toHaveLength(1);
    expect(data.addressBook[0].line1).toBe("Carrer Example 1");
  });

  it("rejects duplicate alias role/code pairs", () => {
    const { errors } = validatePartyNestedInput(
      {
        aliases: [
          { role: "shipper", aliasCode: "EXT-1" },
          { role: "shipper", aliasCode: "EXT-1" },
        ],
      },
      { partyId, partial: true }
    );
    expect(errors.some((e) => e.includes("duplicates"))).toBe(true);
  });

  it("rejects self-referencing related party", () => {
    const { errors } = validatePartyNestedInput(
      {
        relatedParties: [{ relatedPartyId: partyId, relationshipType: "affiliate" }],
      },
      { partyId, partial: true }
    );
    expect(errors.some((e) => e.includes("same party"))).toBe(true);
  });

  it("accepts operational role on related party link", () => {
    const otherId = new mongoose.Types.ObjectId().toString();
    const { errors, data } = validatePartyNestedInput(
      {
        relatedParties: [{ relatedPartyId: otherId, relationshipType: "consignee" }],
      },
      { partyId, partial: true }
    );
    expect(errors).toEqual([]);
    expect(data.relatedParties[0].relationshipType).toBe("consignee");
  });
});
