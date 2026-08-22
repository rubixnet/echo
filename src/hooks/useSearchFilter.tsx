import { useMemo } from "react";

export function useSearchFilter<T extends Record<string, any>>(
  items: T[] | null | undefined,
  searchTerm: string,
  keys: (keyof T)[] = ["title", "artist"],
) {
  return useMemo(() => {
    if (!items) return [];
    if (!searchTerm.trim()) return items;

    const query = searchTerm.toLowerCase();

    return items.filter((item) =>
      keys.some((key) => {
        const value = item[key];
        return typeof value === "string" && value.toLowerCase().includes(query);
      }),
    );
  }, [items, searchTerm, keys]);
}
