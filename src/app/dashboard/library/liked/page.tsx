"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, Music } from "lucide-react";

export default function LikedSongsPage() {
  const likedSongs = useQuery(api.library.getMyLikes);
  const { loadTrack, currentTrackUrl, isPlaying, togglePlay } = useAudioEngine();

  if (likedSongs === undefined) return <div className="text-neutral-400 p-8">Loading...</div>;

  return (
    <div className="space-y-2">
      {likedSongs.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Music className="mx-auto mb-4 opacity-50" size={48} />
          <p>No liked songs yet.</p>
        </div>
      ) : (
        likedSongs.map((track) => {
          const isCurrent = currentTrackUrl === track.audioUrl && isPlaying;
          return (
            <div 
              key={track._id} 
              className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 cursor-pointer"
              onClick={() => {
                if (isCurrent) togglePlay();
                else loadTrack(track.audioUrl, { title: track.title, artist: track.artist, coverUrl: track.coverUrl });
              }}
            >
              <div className="flex items-center gap-4">
                <img src={track.coverUrl} className="w-12 h-12 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-bold">{track.title}</p>
                  <p className="text-xs text-neutral-500">{track.artist}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-neutral-400">{track.duration}</span>
            </div>
          );
        })
      )}
    </div>
  );
}