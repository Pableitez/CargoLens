import { describe, expect, it } from "@jest/globals";
import { deriveOrderTradeNodes } from "./contractualRelationshipNodes.js";

describe("deriveOrderTradeNodes", () => {
  it("uses relationshipType on the link, not the related party global alias", () => {
    const network = {
      primaryParty: {
        _id: "buyer",
        legalName: "Atlantic Grocery NYC",
        aliases: [{ role: "buyer", aliasCode: "BUY-NYC" }],
      },
      members: [
        {
          party: {
            _id: "warehouse",
            legalName: "Valencia Warehouse",
            aliases: [{ role: "shipper", aliasCode: "PEN-SHP" }],
          },
          relationshipType: "parent",
        },
      ],
    };

    const nodes = deriveOrderTradeNodes(network);
    expect(nodes).toEqual([]);
  });

  it("includes related parties only when the link role is shipper or consignee", () => {
    const network = {
      primaryParty: {
        _id: "buyer",
        aliases: [],
      },
      members: [
        {
          party: { _id: "warehouse", aliases: [{ role: "shipper", aliasCode: "PEN-SHP" }] },
          relationshipType: "shipper",
        },
        {
          party: { _id: "store", aliases: [] },
          relationshipType: "consignee",
        },
      ],
    };

    const nodes = deriveOrderTradeNodes(network);
    expect(nodes).toEqual(
      expect.arrayContaining([
        { partyId: "warehouse", role: "shipper" },
        { partyId: "store", role: "consignee" },
      ])
    );
    expect(nodes).toHaveLength(2);
  });

  it("does not auto-assign shipper to the hub without a chain primary role", () => {
    const network = {
      primaryParty: { _id: "buyer", aliases: [] },
      members: [{ party: { _id: "store" }, relationshipType: "consignee" }],
    };

    const nodes = deriveOrderTradeNodes(network);
    expect(nodes).toEqual([{ partyId: "store", role: "consignee" }]);
  });

  it("includes hub primary role from each related-party link", () => {
    const network = {
      primaryParty: { _id: "hub", aliases: [] },
      members: [
        {
          party: { _id: "cne" },
          relationshipType: "consignee",
          primaryRole: "shipper",
        },
      ],
    };

    const nodes = deriveOrderTradeNodes(network);
    expect(nodes).toEqual(
      expect.arrayContaining([
        { partyId: "hub", role: "shipper" },
        { partyId: "cne", role: "consignee" },
      ])
    );
  });

  it("includes hub chain primary role when configured on establish hub", () => {
    const network = {
      primaryParty: { _id: "hub", aliases: [] },
      members: [{ party: { _id: "cne" }, relationshipType: "consignee" }],
    };

    const nodes = deriveOrderTradeNodes(network, { chain: { primaryRole: "shipper" } });
    expect(nodes).toEqual(
      expect.arrayContaining([
        { partyId: "hub", role: "shipper" },
        { partyId: "cne", role: "consignee" },
      ])
    );
  });
});
