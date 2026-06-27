import { describe, expect, it } from "vitest";
import { formatFilterDateLabel, toFilterDateKey } from "./dateFilter";

describe("toFilterDateKey", () => {
  it("normalizes ISO timestamps to local YYYY-MM-DD", () => {
    expect(toFilterDateKey("2026-06-15T10:00:00.000Z")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns empty string for missing values", () => {
    expect(toFilterDateKey(null)).toBe("");
    expect(toFilterDateKey("")).toBe("");
  });
});

describe("formatFilterDateLabel", () => {
  it("formats ISO date keys for chips", () => {
    expect(formatFilterDateLabel("2026-06-01")).toContain("2026");
  });
});
