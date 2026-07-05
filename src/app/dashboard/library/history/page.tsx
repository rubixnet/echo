"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, History, Loader2, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { cn } from "@/lib/utils";

export default function ListeningHistoryPage() {
  const user = useUser();
  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const { playTrack } = useGlobalPlayback();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const removeHistoryItem = useMutation(api.history.removeHistoryItem);
  const historyTracks = useQuery(
    api.history.getUserHistory,
    user?._id ? { userId: user._id } : "skip"
  );

  if (historyTracks === undefined) return <div>Loading history...</div>;

  const handleRemoveFromHistory = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    track: any
  ) => {
    e.stopPropagation();
    if (!user?._id) return;

    try {
      await removeHistoryItem({
        historyId: track._id, 
      });
    } catch (error) {
      console.error("Failed to remove song from history", error);
    }


  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {
        historyTracks.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 border border-dashed border-neutral-200 rounded-3xl">
            <History className="mx-auto mb-4 opacity-50" size={48} />
            <p className="font-bold">No listening history yet.</p>
            <p className="text-sm font-medium mt-1">Songs you listen to will automatically appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100/50">
            {historyTracks.map((track, index) => {
              const videoId = track.youtubeId || track.audioUrl?.split("id=")[1];
              const isLoading = loadingId === videoId;
              const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;

              return (
                <div
                  key={track._id}
                  className="flex items-center justify-between py-3 px-2 group rounded-xl hover:bg-neutral-100 cursor-pointer transition-colors"
                  onClick={() => playTrack({
                    ...track,
                    youtubeId: videoId
                  }, setLoadingId, historyTracks, index)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-neutral-200/50">
                      <img
                        src={track.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop"}
                        className="w-full h-full object-cover"
                        alt={track.title}
                      />

                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center transition-all duration-200",
                        isCurrent ? "bg-black/40 opacity-100" : "bg-neutral-950/30 opacity-0 group-hover:opacity-100"
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
                    <div>
                      <p className={cn("text-sm font-bold tracking-tight", isCurrent ? "text-emerald-600" : "text-neutral-900")}>
                        {track.title}
                      </p>
                      <p className="text-xs font-medium text-neutral-500 mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors">
                      {track.duration || "0:00"}
                    </span>
                    <button
                      onClick={(e) => handleRemoveFromHistory(e, track)}
                      className="bg-neutral-50 p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      title="Remove from history"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div >
  );
}