"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAudioEngine } from "@/hooks/audioPlayer";
import { Search as SearchIcon, Play, Pause, Loader2, Database, Globe, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { loadTrack, togglePlay, currentTrackUrl, isPlaying } = useAudioEngine();

  const hostedTracks = useQuery(api.tracks.search, { searchQuery: searchTerm });
  const ensureYouTubeTrack = useMutation(api.tracks.ensureYouTubeTrack);
  const exclusives = hostedTracks?.filter((t) => t.source === "hosted") || [];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearchingYt(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Server network rejected request");
      const data = await res.json();

      setYtResults(data.items.filter((item: any) => item.type === "stream").slice(0, 10));
    } catch (error) {
      console.error("Global isolation catalog failure:", error);
    } finally {
      setIsSearchingYt(false);
    }
  };

  const handlePlayHosted = (track: any) => {
    if (currentTrackUrl === track.audioUrl) return togglePlay();
    loadTrack(track.audioUrl);
  };
  
  const handlePlayYouTube = async (ytTrack: any) => {
    const videoId = ytTrack.url.split("?v=")[1];
    try {
      setLoadingId(videoId);

      const res = await fetch(`/api/youtube/stream?id=${videoId}`);
      if (!res.ok) throw new Error("Server stream extraction failed");
      const data = await res.json();

      const bestAudio = data.audioStreams.find(
        (s: any) => s.mimeType.startsWith("audio/mp4") || s.format === "M4A"
      );
      if (!bestAudio) throw new Error("No clean audio asset exposed");

      const durationStr = `${Math.floor(ytTrack.duration / 60)}:${(ytTrack.duration % 60)
        .toString()
        .padStart(2, "0")}`;

      await ensureYouTubeTrack({
        youtubeId: videoId,
        title: ytTrack.title,
        artist: ytTrack.uploaderName,
        audioUrl: bestAudio.url,
        coverUrl: ytTrack.thumbnail,
        duration: durationStr
      });

      loadTrack(bestAudio.url);
    } catch (error) {
      console.error("Extraction routing failure:", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-10 pb-32 text-neutral-900 selection:bg-emerald-200 selection:text-emerald-900">
      
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon size={20} className="text-neutral-400 group-focus-within:text-neutral-600 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search tracks, artists, channels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-14 pl-12 pr-32 bg-white rounded-2xl border border-neutral-200/70 shadow-sm text-neutral-900 font-medium placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5 transition-all text-base md:text-lg"
        />
        <button 
          type="submit" 
          disabled={isSearchingYt}
          className="absolute right-2 top-2 bottom-2 px-5 bg-neutral-950 text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors flex items-center justify-center min-w-[90px] disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {isSearchingYt ? <Loader2 size={18} className="animate-spin" /> : "Search"}
        </button>
      </form>

      <div className="space-y-10">
        
        {ytResults.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-emerald-500" /> Global Vault Results
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">{ytResults.length} tracks found</span>
            </div>

            <div className="divide-y divide-neutral-100/70">
              {ytResults.map((track, index) => {
                const videoId = track.url.split("?v=")[1];
                const isLoading = loadingId === videoId;
                const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;

                return (
                  <div
                    key={videoId}
                    onClick={() => handlePlayYouTube(track)}
                    className="flex items-center justify-between py-3 group cursor-pointer hover:bg-neutral-50/50 px-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                        {index + 1}
                      </span>

                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-100">
                        <img src={track.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center transition-all duration-200",
                          isCurrent ? "bg-black/40 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                        )}>
                          {isLoading ? (
                            <Loader2 size={16} className="text-white animate-spin" />
                          ) : isCurrent ? (
                            <Pause size={16} className="text-white fill-white" />
                          ) : (
                            <Play size={16} className="text-white fill-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-4">
                        <p className={cn(
                          "text-sm font-bold truncate tracking-tight",
                          isCurrent ? "text-emerald-600" : "text-neutral-900"
                        )}>
                          {track.title}
                        </p>
                        <p className="text-xs font-medium text-neutral-400 truncate mt-0.5">
                          {track.uploaderName}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 pr-2">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {exclusives.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-400 delay-75">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={14} className="text-neutral-500" /> Echo Exclusives
              </h3>
              <span className="text-[10px] font-bold text-neutral-400">HQ Master Files</span>
            </div>

            <div className="divide-y divide-neutral-100/70">
              {exclusives.map((track, index) => {
                const isCurrent = currentTrackUrl === track.audioUrl && isPlaying;

                return (
                  <div
                    key={track._id}
                    onClick={() => handlePlayHosted(track)}
                    className="flex items-center justify-between py-3 group cursor-pointer hover:bg-neutral-50/50 px-2 -mx-2 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                        {index + 1}
                      </span>

                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-100">
                        <img src={track.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center transition-all duration-200",
                          isCurrent ? "bg-black/40 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                        )}>
                          {isCurrent ? (
                            <Pause size={16} className="text-white fill-white" />
                          ) : (
                            <Play size={16} className="text-white fill-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pr-4">
                        <p className={cn(
                          "text-sm font-bold truncate tracking-tight",
                          isCurrent ? "text-emerald-600" : "text-neutral-900"
                        )}>
                          {track.title}
                        </p>
                        <p className="text-xs font-medium text-neutral-400 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors shrink-0 pr-2">
                      {track.duration || "—:—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {searchTerm === "" && ytResults.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-neutral-200 rounded-3xl bg-white/40 shadow-none">
            <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
              <Music size={20} />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Discover something new</h4>
            <p className="text-xs font-medium text-neutral-400 mt-1 max-w-xs">
              Type above to scan millions of tracks in the Global Vault and see your studio exclusions directly.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}