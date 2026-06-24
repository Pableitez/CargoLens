import { describe, expect, it } from "@jest/globals";
import { generateShareToken, hashShareToken } from "./shareToken.js";

describe("shareToken", () => {
  it("generates unique tokens", () => {
    const a = generateShareToken();
    const b = generateShareToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it("hashes tokens deterministically", () => {
    const token = "abc123";
    expect(hashShareToken(token)).toBe(hashShareToken(token));
    expect(hashShareToken(token)).not.toBe(token);
  });
});
