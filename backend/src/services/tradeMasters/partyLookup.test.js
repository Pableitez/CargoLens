import { resolveOperatingParty, buildPartyLookup } from "./partyLookup.js";

const chain = {
  nodes: [
    { partyId: "p1", role: "shipper" },
    { partyId: "p2", role: "shipper" },
    { partyId: "p3", role: "consignee" },
  ],
};

const parties = [
  {
    _id: "p1",
    code: "FACT-HN",
    legalName: "Factory Honduras",
    aliases: [{ role: "shipper", aliasCode: "ERP-SHP-01" }],
  },
  {
    _id: "p2",
    code: "FACT-SV",
    legalName: "Factory El Salvador",
    aliases: [{ role: "shipper", aliasCode: "ERP-SHP-02" }],
  },
  {
    _id: "p3",
    code: "DC-ES",
    legalName: "DC Spain",
    aliases: [{ role: "consignee", aliasCode: "BE-ITEM" }],
  },
];

describe("buildPartyLookup", () => {
  it("indexes party codes and role-scoped client aliases", () => {
    const lookup = buildPartyLookup(parties);
    expect(lookup.byCode.get("FACT-HN").legalName).toBe("Factory Honduras");
    expect(lookup.byAlias.get("shipper:erp-shp-02").code).toBe("FACT-SV");
    expect(lookup.byAlias.get("consignee:be-item").code).toBe("DC-ES");
  });
});

describe("resolveOperatingParty", () => {
  const lookup = buildPartyLookup(parties);

  it("resolves shipper by party code", () => {
    const result = resolveOperatingParty(chain, "shipper", "FACT-HN", lookup);
    expect(result.party.code).toBe("FACT-HN");
  });

  it("resolves shipper by role alias when code differs", () => {
    const result = resolveOperatingParty(chain, "shipper", "ERP-SHP-02", lookup);
    expect(result.party.code).toBe("FACT-SV");
  });

  it("resolves client alias case-insensitively", () => {
    const lookupWithName = buildPartyLookup([
      ...parties.slice(0, 2),
      {
        ...parties[2],
        aliases: [{ role: "consignee", aliasCode: "Planta Rotterdam" }],
      },
    ]);
    const result = resolveOperatingParty(chain, "consignee", "planta rotterdam", lookupWithName);
    expect(result.party.code).toBe("DC-ES");
  });

  it("resolves consignee by alias", () => {
    const result = resolveOperatingParty(chain, "consignee", "BE-ITEM", lookup);
    expect(result.party.code).toBe("DC-ES");
  });

  it("rejects alias for wrong role", () => {
    const result = resolveOperatingParty(chain, "consignee", "ERP-SHP-01", lookup);
    expect(result.error).toMatch(/not a party code or consignee client name/);
  });

  it("requires operating code when multiple role nodes exist", () => {
    const result = resolveOperatingParty(chain, "shipper", "", lookup);
    expect(result.error).toMatch(/multiple shipper parties/);
  });

  it("auto-picks single consignee without code", () => {
    const result = resolveOperatingParty(chain, "consignee", "", lookup);
    expect(result.party.code).toBe("DC-ES");
  });
});
