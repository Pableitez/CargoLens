import { describe, expect, it } from "@jest/globals";
import { deriveOperationalNodes } from "./supplyChainNetwork.js";

describe("deriveOperationalNodes", () => {
  it("maps related party relationshipType to operational roles", () => {
    const network = {
      primaryParty: {
        _id: "hub1",
        legalName: "Acme Contractual",
        aliases: [],
      },
      members: [
        {
          party: { _id: "p2", legalName: "Port Co", aliases: [] },
          relationshipType: "consignee",
        },
      ],
    };

    const nodes = deriveOperationalNodes(network, { primaryRole: "shipper" });
    expect(nodes).toEqual(
      expect.arrayContaining([
        { partyId: "hub1", role: "shipper" },
        { partyId: "p2", role: "consignee" },
      ])
    );
  });

  it("includes alias roles on hub and members", () => {
    const network = {
      primaryParty: {
        _id: "hub1",
        aliases: [{ role: "consignee", aliasCode: "ACME-CNE" }],
      },
      members: [
        {
          party: { _id: "p2", aliases: [{ role: "shipper", aliasCode: "P2-SHP" }] },
          relationshipType: "affiliate",
        },
      ],
    };

    const nodes = deriveOperationalNodes(network, { primaryRole: "shipper" });
    expect(nodes).toEqual(
      expect.arrayContaining([
        { partyId: "hub1", role: "shipper" },
        { partyId: "hub1", role: "consignee" },
        { partyId: "p2", role: "shipper" },
      ])
    );
  });
});
