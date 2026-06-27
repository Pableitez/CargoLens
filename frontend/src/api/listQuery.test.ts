import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./listQuery";

describe("fetchAllPages", () => {
  it("loads consecutive pages until hasMore is false", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        items: [{ id: "1" }],
        total: 2,
        limit: 1,
        skip: 0,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: "2" }],
        total: 2,
        limit: 1,
        skip: 1,
        hasMore: false,
      });

    const items = await fetchAllPages(fetchPage, 1);

    expect(items).toEqual([{ id: "1" }, { id: "2" }]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
