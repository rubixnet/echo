"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Search as SearchIcon, Loader2, Globe, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Track } from "@/components/TrackComponent";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";

export default function SearchPage() {
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const clearSearchHistory = useMutation(api.search.clearSearchHistory);
  const saveSearch = useMutation(api.search.saveSearch);
  const searchHistory = useQuery(api.search.getRecent, user?._id ? { userId: user._id } : "skip");

  const [showHistoryPopover, setShowHistoryPopover] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedTrackForModal, setSelectedTrackForModal] = useState<any>(null);


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

  useEffect(() => {
    if (initialQuery && ytResults.length === 0 && !isSearchingYt) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    setIsSearchingYt(true);
    setYtResults([]);

    try {
      const fastRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(queryToSearch)}&limit=2`);
      const fastData = await fastRes.json()

      if (fastData.items && fastData.items.length > 0) {
        setYtResults(fastData.items.filter((item: any) => item.type === "stream"));
      }

      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json().catch(() => ({ items: [] }));

      if (res.ok && data.items) {
        setYtResults(data.items.filter((item: any) => item.type === "stream").slice(0, 10));
      }
    } catch (error) {
      setYtResults([]);
    } finally {
      setIsSearchingYt(false);
    }
  };

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

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("q", finalQuery);
    router.replace(currentUrl.pathname + currentUrl.search);

    executeSearch(finalQuery);
    setShowHistoryPopover(false);
    searchInputRef.current?.blur();
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

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    <div className="p-2 max-w-2xl mx-auto space-y-12 text-neutral-900 antialiased">
      <div ref={searchContainerRef} className="relative w-full z-40" >
        <form onSubmit={handleSearchSubmit} className="relative w-full group">
          <LiquidContainer radius="50px" className="w-full h-12 transition-shadow">
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
              className="relative z-30 w-full h-full bg-transparent pl-4 pr-24 font-medium text-foreground placeholder:text-foreground/40 focus:outline-none"
            />

            <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-30 pointer-events-none">
              <div className="hidden sm:flex items-center justify-center mr-3 px-1.5 h-5 bg-foreground/10 border border-foreground/20 rounded text-[10px] font-mono font-bold text-foreground/50">
                /
              </div>
              <button
                type="submit"
                className="pointer-events-auto p-1.5 text-foreground/40 hover:text-foreground transition-colors"
              >
                <SearchIcon size={18} />
              </button>
            </div>
          </LiquidContainer>
        </form>

        {showHistoryPopover && combinedList.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <LiquidPanel radius="24px" className="w-full shadow-2xl shadow-black/40">

              <div className="p-2">
                <div className="space-y-0.5 max-h-[300px] overflow-y-auto liquid-scroll pr-1 mr-1">
                  {combinedList.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => handleSearchSubmit(e, item.text)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-[16px] transition-colors text-left group",
                        index === selectedIndex ? "bg-foreground/10" : "hover:bg-foreground/5"
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
                      {item.type === "history" && (
                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Past</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {searchTerm.trim().length === 0 && (
                <div className="flex items-center justify-end px-4 py-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      if (user?._id) clearSearchHistory({ userId: user._id });
                      setShowHistoryPopover(false);
                    }}
                    className="flex cursor-pointer items-center gap-1.5 text-[10px] font-black text-foreground/40 hover:text-foreground/70 uppercase tracking-widest transition-colors"
                  >
                    Clear Search History
                  </button>
                </div>
              )}
            </LiquidPanel>
          </div>
        )}
      </div>

      <div className="space-y-10">
        {(ytResults.length > 0 || isSearchingYt) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 px-1">
              <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={13} className="text-emerald-500" />
                {isSearchingYt ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-neutral-400" /> Searching Globally...
                  </span>
                ) : "Global Results"}
              </h3>
            </div>

            <div className="divide-y divide-neutral-100/50">

              {ytResults.map((track, index) => {
                const videoId = track.url?.split("?v=")[1] || track.youtubeId || track.id;

                return (
                  <Track
                    key={videoId}
                    track={track}
                    index={index + 1}
                    variant="row"
                    loadingId={loadingId}
                    setLoadingId={setLoadingId}
                    onOpenActionMenu={() => setSelectedTrackForModal(track)}
                  />
                );
              })}


              {isSearchingYt && Array.from({ length: Math.max(0, 10 - ytResults.length) }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex items-center justify-between py-2.5 px-2 -mx-2 opacity-60">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="hidden md:blockw-4 h-4 bg-neutral-100 rounded animate-pulse shrink-0" />
                    <div className="w-11 h-11 rounded-sm bg-neutral-100 animate-pulse shrink-0" />
                    <div className="min-w-0 flex-1 pr-4 space-y-2">
                      <div className="h-3.5 bg-neutral-200/60 rounded w-3/4 animate-pulse" />
                      <div className="h-2.5 bg-neutral-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                  <div className="w-8 h-3 bg-neutral-100 rounded mr-4 animate-pulse shrink-0" />
                  <div className="w-2 h-6 bg-neutral-100 rounded animate-pulse shrink-0 mr-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}