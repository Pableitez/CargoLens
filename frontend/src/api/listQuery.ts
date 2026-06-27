export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
};

export const DEFAULT_LIST_PAGE_SIZE = 200;

export async function fetchAllPages<T>(
  fetchPage: (skip: number, limit: number) => Promise<PaginatedResponse<T>>,
  pageSize = DEFAULT_LIST_PAGE_SIZE
): Promise<T[]> {
  const all: T[] = [];
  let skip = 0;

  for (;;) {
    const page = await fetchPage(skip, pageSize);
    all.push(...page.items);
    if (!page.hasMore) break;
    skip += page.limit;
  }

  return all;
}
