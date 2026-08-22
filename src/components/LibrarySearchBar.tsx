"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SearchIcon, X } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";

interface LibrarySearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export function LibrarySearchBar({ value, onChange }: LibrarySearchBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-3 right-10 hidden w-64 lg:block z-[60] pointer-events-auto">
      <LiquidContainer radius="50px" className="h-11 w-full shadow-none">
        <input
          type="text"
          placeholder="Search Library"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full bg-transparent pl-4 pr-10 text-sm text-foreground focus:outline-none placeholder:text-foreground/50"
        />
        <div className="absolute inset-y-0 right-2 flex items-center pr-2 z-20">
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          ) : (
            <div className="p-1 text-foreground/50 pointer-events-none">
              <SearchIcon size={18} />
            </div>
          )}
        </div>
      </LiquidContainer>
    </div>,
    document.body,
  );
}
