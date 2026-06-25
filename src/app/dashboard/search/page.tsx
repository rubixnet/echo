"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Search as SearchIcon, Play, Pause, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { currentTrackUrl, isPlaying } = useAudioEngine();
  
  const { playTrack } = useGlobalPlayback();

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && (args[0].includes('AbortError') || args[0].includes('Unknown event handler'))) return;
      if (args[0] instanceof Error && args[0].name === 'AbortError') return;
      originalError.call(console, ...args);
    };

    const suppress = (e: PromiseRejectionEvent) => {
      if (
        e.reason?.name === 'AbortError' || 
        e.reason?.message?.includes("AbortError") ||
        e.reason?.message?.includes("play() request was interrupted")
      ) {
        e.preventDefault(); 
      }
    };
    
    window.addEventListener('unhandledrejection', suppress);
    return () => {
      window.removeEventListener('unhandledrejection', suppress);
      console.error = originalError;
    };
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
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json().catch(() => ({ items: [] }));
      if (!res.ok || !data.items) return setYtResults([]);
      setYtResults(data.items.filter((item: any) => item.type === "stream").slice(0, 10));
    } catch (error) {
      setYtResults([]);
    } finally {
      setIsSearchingYt(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("q", searchTerm);
    router.replace(currentUrl.pathname + currentUrl.search);
    executeSearch(searchTerm);
  };


  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-12 pb-32 text-neutral-900 antialiased">

      <form onSubmit={handleSearchSubmit} className="relative w-full group">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search tracks, artists, global vault..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-11 pr-20 bg-neutral-100/70 border border-neutral-200/50 rounded-xl font-medium focus:outline-none focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-200/20 transition-all placeholder:text-neutral-400"
        />
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon size={16} className="text-neutral-400 group-focus-within:text-neutral-600 transition-colors" />
        </div>
        
        <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
           <div className="hidden sm:flex items-center justify-center px-1.5 h-5 bg-neutral-200/60 border border-neutral-300/50 rounded text-[10px] font-mono font-bold text-neutral-400">
              /
           </div>
        </div>

        <button 
          type="submit" 
          disabled={isSearchingYt} 
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-950 transition-colors disabled:opacity-50"
        >
          {isSearchingYt ? <Loader2 size={16} className="animate-spin text-neutral-500" /> : <SearchIcon size={16} className="hover:scale-105" />}
        </button>
      </form>

      <div className="space-y-10">
        {ytResults.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 px-1">
              <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={13} className="text-emerald-500" /> Global Vault Results
              </h3>
            </div>
            
            <div className="divide-y divide-neutral-100/50">
              {ytResults.map((track, index) => {
                const videoId = track.url.split("?v=")[1];
                const isLoading = loadingId === videoId;
                const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;
                
                return (
                  <div key={videoId} onClick={() => playTrack(track, setLoadingId)} className="flex items-center justify-between py-2.5 group cursor-pointer hover:bg-neutral-100/40 px-2 -mx-2 rounded-xl transition-all">
                    
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-50 p-0.5">
                        <img src={track.thumbnail} className="w-full h-full object-cover rounded-[10px]" alt="" />
                        <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-xl", isCurrent ? "bg-black/30 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100")}>
                          {isLoading ? <Loader2 size={14} className="text-white animate-spin" /> : isCurrent ? <Pause size={14} className="text-white fill-white" /> : <Play size={14} className="text-white fill-white ml-0.5" />}
                        </div>
                      </div>
                      
                      <div className="min-w-0 flex-1 pr-4">
                        <p className={cn("text-sm font-bold truncate tracking-tight leading-snug", isCurrent ? "text-emerald-600" : "text-neutral-900")}>
                          {track.title}
                        </p>
                        <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">
                          {track.uploaderName}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-neutral-400 shrink-0 pr-1 group-hover:text-neutral-600 transition-colors">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}