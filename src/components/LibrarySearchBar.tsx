"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ExpandableSearchBar,
  FilterOption,
} from "@/components/ExpandableSearchBar";

export type LibraryFilter = "all" | "playlists" | "songs" | "artists" | "pins";
export type SortOrder = "asc" | "desc";

interface LibrarySearchBarProps {
  value: string;
  onChange: (val: string) => void;
  activeFilter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  sortOrder: SortOrder;
  onToggleSort: () => void;
}

const FILTER_OPTIONS: FilterOption<LibraryFilter>[] = [
  { key: "all", label: "All Items" },
  { key: "playlists", label: "Playlists" },
  { key: "songs", label: "Songs" },
  { key: "artists", label: "Artists" },
  { key: "pins", label: "Pins" },
];

const emptySubscribe = () => () => {};

export function LibrarySearchBar({
  value,
  onChange,
  activeFilter,
  onFilterChange,
  sortOrder,
  onToggleSort,
}: LibrarySearchBarProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-3 right-4 md:right-10 z-[60] pointer-events-auto flex justify-end">
      <ExpandableSearchBar
        value={value}
        onChange={onChange}
        placeholder="Search Library..."
        activeFilter={activeFilter}
        filterOptions={FILTER_OPTIONS}
        onFilterChange={onFilterChange}
        sortOrder={sortOrder}
        onToggleSort={onToggleSort}
        expandedWidthClassName="w-[calc(100vw-2rem)] sm:w-80 md:w-96"
      />
    </div>,
    document.body,
  );
}