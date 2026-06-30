import { buildMockInttraResponse } from "./buildMockInttraResponse.js";
import { mapInttraResponseToApp } from "./mapInttraResponseToApp.js";

describe("buildMockInttraResponse", () => {
  const payload = { carrierScac: "MAEU" };

  it("returns acknowledged by default", () => {
    const raw = buildMockInttraResponse(payload, { requestReference: "CB-001" });
    expect(raw.status).toBe("ACKNOWLEDGED");
    expect(mapInttraResponseToApp(raw).status).toBe("acknowledged");
  });

  it("returns confirmed when outcome is confirmed", () => {
    const raw = buildMockInttraResponse(payload, {
      requestReference: "CB-002",
      outcome: "confirmed",
    });
    expect(raw.status).toBe("CONFIRMED");
    expect(mapInttraResponseToApp(raw).status).toBe("confirmed");
  });

  it("returns rejected when outcome is rejected", () => {
    const raw = buildMockInttraResponse(payload, {
      requestReference: "CB-003",
      outcome: "rejected",
    });
    expect(raw.status).toBe("REJECTED");
    const mapped = mapInttraResponseToApp(raw);
    expect(mapped.status).toBe("rejected");
    expect(mapped.rejectionReason).toMatch(/Mock carrier rejection/);
  });

  it("falls back to acknowledged for unknown outcomes", () => {
    const raw = buildMockInttraResponse(payload, {
      requestReference: "CB-004",
      outcome: "unknown",
    });
    expect(raw.status).toBe("ACKNOWLEDGED");
  });
});
