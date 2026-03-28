import { describe, expect, it } from "vitest";
import {
  buildClientGroups,
  clientKey,
  computeAccordionExpansionSet,
} from "./overviewSnapshotGroups.js";

describe("clientKey", () => {
  it("usa Unassigned sin nombre", () => {
    expect(clientKey({ clientName: "" })).toBe("Unassigned");
    expect(clientKey({})).toBe("Unassigned");
  });

  it("recorta espacios", () => {
    expect(clientKey({ clientName: "  Acme  " })).toBe("Acme");
  });
});

describe("buildClientGroups", () => {
  it("agrupa y ordena por locale", () => {
    const items = [
      { clientName: "Beta", containerNumber: "x" },
      { clientName: "Alpha", containerNumber: "y" },
      { clientName: "Alpha", containerNumber: "z" },
    ];
    const g = buildClientGroups(items, "en");
    expect(g.map((x) => x.clientName)).toEqual(["Alpha", "Beta"]);
    expect(g.find((x) => x.clientName === "Alpha").items).toHaveLength(2);
  });
});

describe("computeAccordionExpansionSet", () => {
  it("sin heavy: todos los grupos", () => {
    const groups = [
      { clientName: "A", items: [] },
      { clientName: "B", items: [] },
    ];
    const s = computeAccordionExpansionSet(groups, false);
    expect(s).toEqual(new Set(["A", "B"]));
  });

  it("heavy: solo el primero", () => {
    const groups = [
      { clientName: "A", items: [] },
      { clientName: "B", items: [] },
    ];
    expect([...computeAccordionExpansionSet(groups, true)]).toEqual(["A"]);
  });

  it("heavy sin grupos: vacío", () => {
    expect([...computeAccordionExpansionSet([], true)]).toEqual([]);
  });
});
