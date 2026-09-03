"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ListFilter,
  ArrowUpDown,
  ArrowDownUp,
} from "@/components/icons";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface FilterOption<T extends string = string> {
  key: T;
  label: string;
}

interface ExpandableSearchBarProps<T extends string = string> {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  activeFilter?: T;
  filterOptions?: FilterOption<T>[];
  onFilterChange?: (filter: T) => void;
  sortOrder?: "asc" | "desc";
  onToggleSort?: () => void;
  onExpandChange?: (expanded: boolean) => void;
  className?: string;
  expandedWidthClassName?: string;
}

export function ExpandableSearchBar<T extends string = string>({
  value,
  onChange,
  placeholder = "Search...",
  activeFilter,
  filterOptions,
  onFilterChange,
  sortOrder,
  onToggleSort,
  onExpandChange,
  className,
  expandedWidthClassName = "w-[calc(100vw-2rem)] sm:w-72 md:w-80",
}: ExpandableSearchBarProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = Boolean(
    filterOptions && filterOptions.length > 0 && onFilterChange
  );
  const hasSort = Boolean(sortOrder && onToggleSort);

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleOpen = () => {
    setIsExpanded(true);
    onExpandChange?.(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    onExpandChange?.(false);
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const collapsedWidthClass =
    hasFilters && hasSort
      ? "w-[128px]"
      : hasFilters || hasSort
        ? "w-[88px]"
        : "w-[48px]";

  return (
    <div
      className={cn(
        "relative flex items-center justify-end transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isExpanded ? expandedWidthClassName : collapsedWidthClass,
        className
      )}
    >
      <LiquidContainer
        radius="50px"
        className="h-11 w-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        <div
          className={cn(
            "h-full inset-0 flex items-center justify-end p-1 transition-all duration-200 ease-out",
            isExpanded
              ? "opacity-0 blur-sm scale-90 pointer-events-none -translate-x-2"
              : "opacity-100 blur-0 scale-100 pointer-events-auto translate-x-0"
          )}
        >
          <Button
            variant="ghost"
            className="h-full w-10 px-0 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10"
            onClick={handleOpen}
            title="Search"
          >
            <Search size={16} />
          </Button>

          {hasFilters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-full w-10 px-0 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                  title="Filters"
                >
                  <ListFilter size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 mt-1 shadow-lg z-[100]">
                {filterOptions?.map((f) => {
                  const isSelected = activeFilter === f.key;
                  return (
                    <DropdownMenuItem
                      key={f.key}
                      onClick={() => onFilterChange?.(f.key)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex w-4 items-center justify-center">
                          {isSelected && <Check className="h-4 w-4" />}
                        </span>
                        <span className="capitalize">{f.label}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasSort && (
            <Button
              variant="ghost"
              className="h-full w-10 px-0 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/10"
              onClick={onToggleSort}
              title="Toggle Sort"
            >
              {sortOrder === "desc" ? (
                <ArrowDownUp size={16} />
              ) : (
                <ArrowUpDown size={16} className="scale-x-[-1]" />
              )}
            </Button>
          )}
        </div>

        <div
          className={cn(
            "absolute inset-0 flex items-center pl-3 pr-2 transition-all duration-200 ease-out",
            isExpanded
              ? "opacity-100 blur-0 scale-100 pointer-events-auto delay-75"
              : "opacity-0 blur-sm scale-98 pointer-events-none"
          )}
        >
          <div className="text-foreground/50 shrink-0 mr-2 pointer-events-none">
            <Search size={16} />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 h-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-foreground/50"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 mr-1 text-foreground/50 hover:text-foreground transition-colors cursor-pointer shrink-0"
              title="Clear input"
            >
              <X size={15} />
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 px-2.5 text-xs font-semibold rounded-full hover:bg-foreground/10 text-foreground/70 hover:text-foreground shrink-0"
          >
            Cancel
          </Button>
        </div>
      </LiquidContainer>
    </div>
  );
}