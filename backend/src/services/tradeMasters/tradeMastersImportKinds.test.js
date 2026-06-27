import { describe, expect, it } from "@jest/globals";
import {
  importKindToSlug,
  normalizeImportKind,
  TRADE_MASTERS_IMPORT_KINDS,
} from "./tradeMastersImportKinds.js";

describe("tradeMastersImportKinds", () => {
  it("normalizes URL slugs to internal kinds", () => {
    expect(normalizeImportKind("parties")).toBe("parties");
    expect(normalizeImportKind("related-parties")).toBe("related_parties");
    expect(normalizeImportKind("related-facilities")).toBe("related_facilities");
    expect(normalizeImportKind("unknown")).toBeNull();
  });

  it("maps kinds to URL slugs", () => {
    expect(importKindToSlug("related_parties")).toBe("related-parties");
  });

  it("lists all supported kinds", () => {
    expect(TRADE_MASTERS_IMPORT_KINDS).toHaveLength(4);
  });
});
