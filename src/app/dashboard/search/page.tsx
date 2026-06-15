"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Search as SearchIcon, Play, Pause, Loader2, Database, Globe, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { loadTrack, togglePlay, currentTrackUrl, isPlaying, setActiveMetadata, setIsLoading } = useAudioEngine();

  const hostedTracks = useQuery(api.tracks.search, { searchQuery: searchTerm });
  const ensureYoutubeTrack = useMutation(api.tracks.ensureYoutubeTrack);
  const exclusives = hostedTracks?.filter((t) => t.source === "hosted") || [];

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
      let data;
      try {
        data = await res.json();
      } catch (err) {
        data = { items: [] };
      }

      if (!res.ok || !data.items) {
        setYtResults([]);
        return;
      }

      setYtResults(data.items.filter((item: any) => item.type === "stream").slice(0, 10));
    } catch (error) {
      console.error("Global isolation catalog failure:", error);
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

  const handlePlayHosted = (track: any) => {
    if (currentTrackUrl === track.audioUrl) return togglePlay();
    loadTrack(track.audioUrl, {
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl
    });
  };

const handlePlayYouTube = async (ytTrack: any) => {
    const videoId = ytTrack.url.split("?v=")[1];
    const standardYoutubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    setIsLoading(true);
    setLoadingId(videoId);

    try {
      loadTrack(standardYoutubeUrl, {
        title: ytTrack.title,
        artist: ytTrack.uploaderName,
        coverUrl: ytTrack.thumbnail,
      });

      const durationStr = `${Math.floor(ytTrack.duration / 60)}:${(ytTrack.duration % 60)
        .toString()
        .padStart(2, "0")}`;
      
        await ensureYoutubeTrack({
        youtubeId: videoId,
        title: ytTrack.title,
        artist: ytTrack.uploaderName,
        audioUrl: standardYoutubeUrl, 
        coverUrl: ytTrack.thumbnail,
        duration: durationStr
      });

    } catch (error: any) {
      console.error("Playback routing failure:", error.message);
    } finally {
      setIsLoading(false);
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-12 pb-32 text-neutral-900 selection:bg-emerald-200 selection:text-emerald-900 antialiased">
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <input
          type="text"
          placeholder="Search tracks, artists, global vault..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-11 pr-11 bg-neutral-100/70 border border-neutral-200/50 rounded-xl text-neutral-900 placeholder:text-neutral-400 font-medium focus:outline-none focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-200/20 transition-all text-base"
        />
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon size={16} className="text-neutral-400" />
        </div>

        <button
          type="submit"
          disabled={isSearchingYt}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-950 transition-colors disabled:opacity-50"
        >
          {isSearchingYt ? (
            <Loader2 size={16} className="animate-spin text-neutral-500" />
          ) : (
            <SearchIcon size={16} className="hover:scale-105 transition-transform" />
          )}
        </button>
      </form>

      <div className="space-y-10">
        {ytResults.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 px-1">
              <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={13} className="text-emerald-500" /> Global Vault Results
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">{ytResults.length} tracks</span>
            </div>

            <div className="divide-y divide-neutral-100/50">
              {ytResults.map((track, index) => {
                const videoId = track.url.split("?v=")[1];
                const isLoading = loadingId === videoId;
                const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;

                return (
                  <div
                    key={videoId}
                    onClick={() => handlePlayYouTube(track)}
                    className="flex items-center justify-between py-2.5 group cursor-pointer hover:bg-neutral-100/40 px-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>

                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-50 p-0.5">
                        <img src={track.thumbnail} className="w-full h-full object-cover rounded-[10px] group-hover:scale-105 transition-transform duration-500" alt="" />
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-xl",
                          isCurrent ? "bg-black/30 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                        )}>
                          {isLoading ? (
                            <Loader2 size={14} className="text-white animate-spin" />
                          ) : isCurrent ? (
                            <Pause size={14} className="text-white fill-white" />
                          ) : (
                            <Play size={14} className="text-white fill-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-4">
                        <p className={cn(
                          "text-sm font-bold truncate tracking-tight leading-snug",
                          isCurrent ? "text-emerald-600" : "text-neutral-900"
                        )}>
                          {track.title}
                        </p>
                        <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">
                          {track.uploaderName}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 pr-1">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {exclusives.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2 px-1">
              <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={13} className="text-neutral-500" /> Echo Exclusives
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">HQ Master Files</span>
            </div>

            <div className="divide-y divide-neutral-100/50">
              {exclusives.map((track, index) => {
                const isCurrent = currentTrackUrl === track.audioUrl && isPlaying;

                return (
                  <div
                    key={track._id}
                    onClick={() => handlePlayHosted(track)}
                    className="flex items-center justify-between py-2.5 group cursor-pointer hover:bg-neutral-100/40 px-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>

                      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-50 p-0.5">
                        <img src={track.coverUrl} className="w-full h-full object-cover rounded-[10px] group-hover:scale-105 transition-transform duration-500" alt="" />
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-xl",
                          isCurrent ? "bg-black/30 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                        )}>
                          {isCurrent ? (
                            <Pause size={14} className="text-white fill-white" />
                          ) : (
                            <Play size={14} className="text-white fill-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-4">
                        <p className={cn(
                          "text-sm font-bold truncate tracking-tight leading-snug",
                          isCurrent ? "text-emerald-600" : "text-neutral-900"
                        )}>
                          {track.title}
                        </p>
                        <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 pr-1">
                      {track.duration || "—:—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {searchTerm === "" && ytResults.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-14 border border-dashed border-neutral-200 rounded-2xl bg-white/30">
            <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-neutral-400 mb-3.5 shadow-sm">
              <Music size={18} />
            </div>
            <h4 className="text-sm font-bold text-neutral-900 tracking-tight">Search parameters initialized</h4>
            <p className="text-xs font-medium text-neutral-400 mt-1 max-w-xs leading-relaxed">
              Scan millions of uncompressed master audio streams inside the global system vaults instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}