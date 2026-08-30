"use client";

import { useSyncExternalStore, useState } from "react";
import { createPortal } from "react-dom";
import {
  ExpandableSearchBar,
  FilterOption,
} from "@/components/ExpandableSearchBar";
import { cn } from "@/lib/utils";

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

export const LIBRARY_FILTER_OPTIONS: FilterOption<LibraryFilter>[] = [
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
  const [isExpanded, setIsExpanded] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={cn(
          "md:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md backdrop-saturate-200 bg-background/80 [-webkit-mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_75%,transparent_100%)] pointer-events-none z-50 transition-opacity duration-300 ease-in-out",
          isExpanded ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="fixed top-2.5 right-4 md:right-8 lg:right-10 z-[60] pointer-events-auto flex items-center justify-end">
        <ExpandableSearchBar
          value={value}
          onChange={onChange}
          placeholder="Search Library..."
          activeFilter={activeFilter}
          filterOptions={LIBRARY_FILTER_OPTIONS}
          onFilterChange={onFilterChange}
          sortOrder={sortOrder}
          onToggleSort={onToggleSort}
          onExpandChange={setIsExpanded}
          expandedWidthClassName="w-[calc(100vw-2rem)] sm:w-72 md:w-80"
        />
      </div>
    </>,
    document.body,
  );
}