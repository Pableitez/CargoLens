export const DEFAULT_LIST_LIMIT = 200;
export const MAX_LIST_LIMIT = 500;

export function parseListQuery(query = {}) {
  let limit = Number.parseInt(String(query.limit ?? DEFAULT_LIST_LIMIT), 10);
  let skip = Number.parseInt(String(query.skip ?? 0), 10);

  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIST_LIMIT;
  if (limit > MAX_LIST_LIMIT) limit = MAX_LIST_LIMIT;
  if (!Number.isFinite(skip) || skip < 0) skip = 0;

  return { limit, skip };
}

export async function paginatedFind(Model, filter, { sort = { updatedAt: -1 }, limit, skip, serialize }) {
  const [rows, total] = await Promise.all([
    Model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Model.countDocuments(filter),
  ]);

  return paginatedResponse(rows.map(serialize), total, limit, skip);
}

export function paginatedResponse(items, total, limit, skip) {
  return {
    items,
    total,
    limit,
    skip,
    hasMore: skip + items.length < total,
  };
}
