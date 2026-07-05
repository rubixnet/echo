"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api"
import { useAudioEngine } from "@/components/AudioProvider";
import { useUser } from "@/hooks/useUser";
import { Search as SearchIcon, History, Sparkles, Loader2, Play, Pause, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { ActionsModal } from "@/components/ActionsModal";

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showHistoryPopover, setShowHistoryPopover] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const clearSearchHistory = useMutation(api.search.clearSearchHistory);
  const saveSearch = useMutation(api.search.saveSearch);
  const searchHistory = useQuery(api.search.getRecent, user?._id ? { userId: user._id } : "skip");


  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/suggest?q=${encodeURIComponent(searchTerm)}`);
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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowHistoryPopover(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveSearchQuery = async (query: string) => {
    if (user?._id) {
      await saveSearch({ userId: user._id, searchQuery: query });
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent, directQuery?: string) => {
    e?.preventDefault();
    const finalQuery = directQuery || searchTerm;
    if (!finalQuery.trim()) return;

    setSearchTerm(finalQuery);
    saveSearchQuery(finalQuery);

    setShowHistoryPopover(false);
    searchInputRef.current?.blur();

    router.push(`/dashboard/search?q=${encodeURIComponent(finalQuery)}`);


  };

  const combinedList = useMemo(() => {
    const isTyping = searchTerm.trim().length > 0;

    const matchedHistory = isTyping
      ? (searchHistory || []).filter(h => h.searchQuery.toLowerCase().includes(searchTerm.toLowerCase()))
      : (searchHistory || []);

    const historyTextSet = new Set(matchedHistory.map(h => h.searchQuery.toLowerCase()));
    const filteredSuggestions = isTyping
      ? suggestions.filter(s => !historyTextSet.has(s.toLowerCase()))
      : [];

    return [
      ...matchedHistory.map(h => ({ text: h.searchQuery, type: "history", id: h._id })),
      ...filteredSuggestions.map(s => ({ text: s, type: "suggestion", id: s }))
    ];


  }, [searchTerm, searchHistory, suggestions]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const listLength = combinedList.length;
    if (!showHistoryPopover || listLength === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < listLength - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSubmit(e as any, combinedList[selectedIndex].text);
    } else if (e.key === "Escape") {
      setShowHistoryPopover(false);
      searchInputRef.current?.blur();
    }


  };

  return (
    <div>
      <section className="p-6 md:p-10 max-w-2xl mx-auto space-y-12 pb-32 text-neutral-900 antialiased">
        <div ref={searchContainerRef} className="relative w-full z-40">
          <form onSubmit={handleSearchSubmit} className="relative w-full group">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tracks, artists, global vault..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowHistoryPopover(true);
                setSelectedIndex(-1);
              }}
              onFocus={() => setShowHistoryPopover(true)}
              onKeyDown={handleInputKeyDown}
              className="w-full h-12 pl-4 pr-20 bg-white/20 border border-neutral-200/50 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-200/20 transition-all placeholder:text-neutral-400"
            />

            <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
              <div className="hidden sm:flex items-center justify-center px-1.5 h-5 bg-neutral-100/60 border border-neutral-300/50 rounded text-[10px] font-mono font-bold text-neutral-400">
                /
              </div>
            </div>

            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-950 transition-colors"
            >
              <SearchIcon size={19} className="hover:scale-105 transition-transform" />
            </button>
          </form>

          {showHistoryPopover && combinedList.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200/60 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-1.5 space-y-0.5 max-h-[300px] overflow-y-auto">
                {combinedList.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => handleSearchSubmit(e, item.text)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-left group",
                      index === selectedIndex ? "bg-neutral-100" : "hover:bg-neutral-100/60"
                    )}
                  >
                    <div className="flex items-center gap-3 text-neutral-500 group-hover:text-neutral-950 transition-colors">
                      {item.type === "history" ? (
                        <History size={16} className="text-emerald-500" />
                      ) : (
                        <SearchIcon size={16} className="text-neutral-400" />
                      )}
                      <span className={cn(
                        "text-sm font-medium text-neutral-700 group-hover:text-neutral-950"
                      )}>
                        {item.text}
                      </span>
                    </div>
                    {item.type === "history" && (
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Past</span>
                    )}
                  </button>
                ))}
              </div>

              {searchTerm.trim().length === 0 && (
                <div className="flex items-center justify-end px-3 py-1 bg-neutral-50/50 border-b border-neutral-100/80">
                  <button
                    type="button"
                    onClick={() => {
                      if (user?._id) clearSearchHistory({ userId: user._id });
                      setShowHistoryPopover(false);
                    }}
                    className="flex cursor-pointer items-center gap-1.5 text-[10px] font-black text-neutral-400 hover:text-neutral-600 uppercase tracking-widest transition-colors"
                  >
                    Clear Search History
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}