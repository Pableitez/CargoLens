import { describe, expect, it } from "@jest/globals";
import { applyContractualPartyListFilter, canAccessContractualPartyResource } from "./contractualAccess.js";

describe("contractualAccess", () => {
  const portalReq = {
    user: {
      companyId: "507f1f77bcf86cd799439011",
      clientId: "507f1f77bcf86cd799439012",
    },
  };

  const staffReq = {
    user: {
      companyId: "507f1f77bcf86cd799439011",
      clientId: null,
    },
  };

  it("scopes order list queries for portal users", () => {
    const q = applyContractualPartyListFilter({ companyId: "abc" }, portalReq);
    expect(String(q.contractualPartyId)).toBe("507f1f77bcf86cd799439012");
    expect(q.companyId).toBe("abc");
  });

  it("leaves order list queries unchanged for staff", () => {
    const q = applyContractualPartyListFilter({ companyId: "abc" }, staffReq);
    expect(q).toEqual({ companyId: "abc" });
  });

  it("allows staff to access any contractual party resource", () => {
    expect(canAccessContractualPartyResource({ contractualPartyId: "x" }, null)).toBe(true);
  });

  it("denies portal access when contractualPartyId is missing", () => {
    expect(canAccessContractualPartyResource({}, "507f1f77bcf86cd799439012")).toBe(false);
  });

  it("allows portal access when contractualPartyId matches", () => {
    expect(
      canAccessContractualPartyResource(
        { contractualPartyId: "507f1f77bcf86cd799439012" },
        "507f1f77bcf86cd799439012"
      )
    ).toBe(true);
  });

  it("denies portal access when contractualPartyId differs", () => {
    expect(
      canAccessContractualPartyResource(
        { contractualPartyId: "507f1f77bcf86cd799439099" },
        "507f1f77bcf86cd799439012"
      )
    ).toBe(false);
  });
});
