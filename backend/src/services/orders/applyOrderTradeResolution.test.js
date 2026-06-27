import { describe, expect, it, jest } from "@jest/globals";

jest.unstable_mockModule("../tradeMasters/resolveOrderTrade.js", () => ({
  companyUsesTradeMasters: jest.fn(),
  resolveOrderTrade: jest.fn(),
  resolveOrderTradeFromSelection: jest.fn(),
}));

const { companyUsesTradeMasters, resolveOrderTradeFromSelection } =
  await import("../tradeMasters/resolveOrderTrade.js");
const { applyOrderTradeResolution } = await import("./applyOrderTradeResolution.js");

describe("applyOrderTradeResolution", () => {
  it("passes through body when trade masters are disabled", async () => {
    companyUsesTradeMasters.mockResolvedValue(false);
    const body = { orderNumber: "ORD-1", customer: "Acme" };
    const result = await applyOrderTradeResolution("company-id", body);
    expect(result.errors).toEqual([]);
    expect(result.data).toBe(body);
  });

  it("requires trade selection when trade masters are enabled", async () => {
    companyUsesTradeMasters.mockResolvedValue(true);
    const result = await applyOrderTradeResolution("company-id", { orderNumber: "ORD-1" });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.data).toBeNull();
  });

  it("resolves trade from selection ids", async () => {
    companyUsesTradeMasters.mockResolvedValue(true);
    resolveOrderTradeFromSelection.mockResolvedValue({
      errors: [],
      data: {
        contractualPartyId: "client-1",
        supplyChainId: "chain-1",
        operatingShipperPartyId: "shipper-1",
        operatingConsigneePartyId: "consignee-1",
        customer: "Acme Corp",
        shipper: "Valencia WH",
        consignee: "Rotterdam DC",
        defaultIncoterm: "FOB",
        defaultTransportMode: "ocean",
        defaultPortOfLoading: "ESVLC",
        defaultPortOfDischarge: "NLRTM",
      },
    });

    const result = await applyOrderTradeResolution("company-id", {
      orderNumber: "ORD-1",
      contractualPartyId: "client-1",
      supplyChainId: "chain-1",
      operatingShipperPartyId: "shipper-1",
      operatingConsigneePartyId: "consignee-1",
    });

    expect(result.errors).toEqual([]);
    expect(result.data.customer).toBe("Acme Corp");
    expect(result.data.incoterm).toBe("FOB");
    expect(result.data.transportMode).toBe("ocean");
  });
});
