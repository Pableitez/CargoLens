import { describe, expect, it } from "@jest/globals";
import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT, parseListQuery, paginatedResponse } from "./listQuery.js";

describe("parseListQuery", () => {
  it("uses defaults when params are missing", () => {
    expect(parseListQuery({})).toEqual({ limit: DEFAULT_LIST_LIMIT, skip: 0 });
  });

  it("clamps limit to max", () => {
    expect(parseListQuery({ limit: "9999" }).limit).toBe(MAX_LIST_LIMIT);
  });

  it("rejects invalid skip", () => {
    expect(parseListQuery({ skip: "-5" }).skip).toBe(0);
  });
});

describe("paginatedResponse", () => {
  it("sets hasMore when more rows exist", () => {
    expect(paginatedResponse(["a", "b"], 5, 2, 0)).toEqual({
      items: ["a", "b"],
      total: 5,
      limit: 2,
      skip: 0,
      hasMore: true,
    });
  });

  it("clears hasMore on the last page", () => {
    expect(paginatedResponse(["c"], 3, 2, 2)).toEqual({
      items: ["c"],
      total: 3,
      limit: 2,
      skip: 2,
      hasMore: false,
    });
  });
});
