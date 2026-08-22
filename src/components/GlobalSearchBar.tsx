"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { Search as SearchIcon, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";

export function GlobalSearchBar() {
  const user = useUser();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const saveSearch = useMutation(api.search.saveSearch);
  const searchHistory = useQuery(
    api.search.getRecent,
    user?._id ? { userId: user._id } : "skip",
  );
  const clearSearchHistory = useMutation(api.search.clearSearchHistory);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/youtube/suggest?q=${encodeURIComponent(searchTerm)}`,
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }, 150);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowHistoryPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = async (
    e: React.FormEvent,
    directQuery?: string,
  ) => {
    e?.preventDefault();
    const finalQuery = directQuery || searchTerm;
    if (!finalQuery.trim()) return;

    setSearchTerm(finalQuery);
    if (user?._id)
      await saveSearch({ userId: user._id, searchQuery: finalQuery });

    setShowHistoryPopover(false);
    searchInputRef.current?.blur();
    router.push(`/dashboard/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const combinedList = useMemo(() => {
    const isTyping = searchTerm.trim().length > 0;
    const matchedHistory = isTyping
      ? (searchHistory || []).filter((h) =>
          h.searchQuery.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : searchHistory || [];
    const historyTextSet = new Set(
      matchedHistory.map((h) => h.searchQuery.toLowerCase()),
    );
    const filteredSuggestions = isTyping
      ? suggestions.filter((s) => !historyTextSet.has(s.toLowerCase()))
      : [];

    return [
      ...matchedHistory.map((h) => ({
        text: h.searchQuery,
        type: "history",
        id: h._id,
      })),
      ...filteredSuggestions.map((s) => ({
        text: s,
        type: "suggestion",
        id: s,
      })),
    ];
  }, [searchTerm, searchHistory, suggestions]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const listLength = combinedList.length;
    if (!showHistoryPopover || listLength === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < listLength - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSubmit(e as any, combinedList[selectedIndex].text);
    } else if (e.key === "Escape") {
      setShowHistoryPopover(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <div
      ref={searchContainerRef}
      className="relative w-full z-50 animate-in fade-in zoom-in-95 duration-300"
    >
      <form onSubmit={handleSearchSubmit} className="w-full group">
        <LiquidContainer radius="50px" className="w-full h-11 ">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tracks, and artists.."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowHistoryPopover(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowHistoryPopover(true)}
            onKeyDown={handleInputKeyDown}
            className="relative z-10 w-full h-full bg-transparent pl-6 pr-16 font-medium text-foreground placeholder:text-foreground/40 focus:outline-none"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 z-20">
            <button
              type="submit"
              className="p-1.5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <SearchIcon size={20} />
            </button>
          </div>
        </LiquidContainer>
      </form>

      {showHistoryPopover && combinedList.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-3 slide-in-from-top-2 duration-200 z-50">
          <LiquidPanel radius="24px" className="w-full">
            <div className="p-2">
              <div className="space-y-0.5 overflow-y-auto liquid-scroll pr-1 mr-1">
                {combinedList.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => handleSearchSubmit(e, item.text)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-[16px] transition-colors text-left group",
                      index === selectedIndex
                        ? "bg-foreground/10"
                        : "hover:bg-foreground/5",
                    )}
                  >
                    <div className="flex items-center gap-3 text-foreground/50 group-hover:text-foreground transition-colors">
                      {item.type === "history" ? (
                        <History size={16} className="text-primary" />
                      ) : (
                        <SearchIcon size={16} className="text-foreground/40" />
                      )}
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                        {item.text}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    clearSearchHistory({ userId: user?._id || "skip" })
                  }
                  className="text-sm pr-2 text-foreground/50 hover:text-foreground transition-colors"
                >
                  Clear Search History
                </button>
              </div>
            </div>
          </LiquidPanel>
        </div>
      )}
    </div>
  );
}
