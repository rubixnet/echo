"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, Music, Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { cn } from "@/lib/utils";

export default function LikedSongsPage() {
  const user = useUser();
  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const { playTrack } = useGlobalPlayback();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const likedSongs = useQuery(
    api.likes.getMyLikes,
    user?._id ? { userId: user._id } : "skip"
  );

  if (likedSongs === undefined) return <div className="text-neutral-400 p-8">Loading...</div>;
  
  return (
    <div className="max-w-4xl">
      {likedSongs.length === 0 ? (
        <div className="text-center py-20 text-neutral-400 border border-dashed border-neutral-200 rounded-3xl">
          <Music className="mx-auto mb-4 opacity-50" size={48} />
          <p className="font-bold">No liked songs yet.</p>
          <p className="text-sm font-medium mt-1">Start hitting the heart icon to build your library.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100/50">
          {likedSongs.map((track) => {
            const videoId = track.audioUrl?.split("id=")[1];
            const isLoading = loadingId === videoId;
            const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;

            return (
              <div
                key={track._id}
                className="flex items-center justify-between py-3 px-2 group rounded-xl hover:bg-neutral-100 cursor-pointer transition-colors"
                onClick={() => playTrack({
                  ...track,
                  youtubeId: videoId
                }, setLoadingId)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-neutral-200/50">
                    <img src={track.coverUrl} className="w-full h-full object-cover" />

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
                <span className="text-xs font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors">
                  {track.duration}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}