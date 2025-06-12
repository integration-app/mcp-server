export async function fetchAllWithPagination<T>(
  fetchFn: (params: {
    cursor?: string;
  }) => Promise<{ items: T[]; cursor?: string }>
): Promise<T[]> {
  const allItems: T[] = [];
  let cursor: string | undefined;

  do {
    const result = await fetchFn({ cursor });
    allItems.push(...result.items);
    cursor = result.cursor;
  } while (cursor);

  return allItems;
}
