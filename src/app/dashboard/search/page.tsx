"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Globe, Search as SearchIcon } from "lucide-react";
import { Track } from "@/components/TrackComponent";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<any>(null);

  useEffect(() => {
    if (query) {
      executeSearch(query);
    } else {
      setYtResults([]);
    }
  }, [query]);

  const executeSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    setIsSearchingYt(true);
    setYtResults([]);

    try {
      const fastRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(queryToSearch)}&limit=2`);
      const fastData = await fastRes.json();

      if (fastData.items && fastData.items.length > 0) {
        setYtResults(fastData.items.filter((item: any) => item.type === "stream"));
      }

      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json().catch(() => ({ items: [] }));

      if (res.ok && data.items) {
        setYtResults(data.items.filter((item: any) => item.type === "stream").slice(0, 10));
      }
    } catch (error) {
      console.error("Search failed:", error);
      setYtResults([]);
    } finally {
      setIsSearchingYt(false);
    }
  };

  return (
    <div className="p-2 max-w-2xl mx-auto pt-4 md:pt-6 text-foreground antialiased">

      <div className="block md:hidden mb-6 z-50 relative">
        <GlobalSearchBar />
      </div>
      {!query && !isSearchingYt ? (

        <div className="flex flex-col items-center justify-center h-[50vh] text-foreground/40 animate-in fade-in zoom-in-95">
        </div>
      ) : (
        <div className="space-y-10">
          {(ytResults.length > 0 || isSearchingYt) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">

              <div className="items-center hidden md:flex justify-between border-b border-foreground/10 pb-2 px-1">
                <h3 className="text-[13px] text-foreground/80 items-center gap-2">
                  {isSearchingYt ? (
                    <span className="flex-1 items-center gap-2">
                      Searching Globally...
                    </span>
                  ) : `Results for "${query}"`}
                </h3>
              </div>

              <div className="divide-y divide-foreground/5">
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
                      <div className="hidden md:block w-4 h-4 bg-foreground/10 rounded animate-pulse shrink-0" />
                      <div className="w-11 h-11 rounded-sm bg-foreground/10 animate-pulse shrink-0" />
                      <div className="min-w-0 flex-1 pr-4 space-y-2">
                        <div className="h-3.5 bg-foreground/20 rounded w-3/4 animate-pulse" />
                        <div className="h-2.5 bg-foreground/10 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                    <div className="w-8 h-3 bg-foreground/10 rounded mr-4 animate-pulse shrink-0" />
                    <div className="w-2 h-6 bg-foreground/10 rounded animate-pulse shrink-0 mr-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      )}
    </div>
  );
}