"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, Pin, Heart, History, ListMusic } from "lucide-react";
import { Track } from "@/components/TrackComponent";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function LibraryHubPage() {
  const user = useUser();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const playlists = useQuery(
    api.playlists.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip"
  );
  const likedSongs = useQuery(
    api.likes.getMyLikes,
    user?._id ? { userId: user._id } : "skip"
  );
  const historySongs = useQuery(
    api.history.getUserHistory,
    user?._id ? { userId: user._id } : "skip"
  );

  if (playlists === undefined || likedSongs === undefined || historySongs === undefined) {
    return (
      <div className="flex justify-center py-20 bg-background">
        <Loader2 className="animate-spin text-foreground/50" size={32} />
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-12 py-10 space-y-12 bg-background text-foreground max-w-7xl mx-auto">
      
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Your Library</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          
          {historySongs.length > 0 && (
            <div
              onClick={() => router.push(`/dashboard/library/history`)}
              className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
            >
              <div className="aspect-square w-full rounded-md overflow-hidden bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-sm mb-3">
                <History size={56} className="fill-transparent text-white drop-shadow-md" />
              </div>
              <h3 className="font-bold text-sm text-foreground truncate">Recently Played</h3>
              <p className="text-xs font-medium text-foreground/50 mt-0.5">
                {historySongs.length === 1 ? "1 song" : `${historySongs.length} songs`}
              </p>
            </div>
          )}

          {likedSongs.length > 0 && (
            <div
              onClick={() => router.push(`/dashboard/library/liked`)}
              className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
            >
              <div className="aspect-square w-full rounded-md overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm mb-3">
                <Heart size={56} className="fill-white text-white drop-shadow-md" />
              </div>
              <h3 className="font-bold text-sm text-foreground truncate">Liked Songs</h3>
              <p className="text-xs font-medium text-foreground/50 mt-0.5">
                {likedSongs.length === 1 ? "1 song" : `${likedSongs.length} songs`}
              </p>
            </div>
          )}

          {playlists.map((p) => (
            <LibraryPlaylistItem key={p._id} playlist={p} />
          ))}

        </div>

        {playlists.length === 0 && historySongs.length === 0 && likedSongs.length === 0 && (
          <div className="py-8 text-sm font-medium text-foreground/50">
            Your library is empty.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recently Saved Songs</h2>
        </div>

        {likedSongs.length === 0 ? (
          <div className="py-8 text-sm font-medium text-foreground/50">
            No songs saved yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1">
            {likedSongs.map((track, index) => (
              <Track
                key={track._id}
                track={track}
                index={index + 1}
                variant="row"
                loadingId={loadingId}
                setLoadingId={setLoadingId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LibraryPlaylistItem({ playlist }: { playlist: any }) {
  const router = useRouter();
  
  const tracks = useQuery(api.playlists.getPlaylistTracks, {
    playlistId: playlist._id,
  });
  
  const trackCount = tracks?.length || 0;
  const coverUrl =
    playlist.coverUrl ||
    (tracks && tracks.length > 0 ? tracks[0]?.coverUrl : null);

  const handlePin = (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    // TODO: Add backend logic to pin/unpin playlist
    console.log("Pinning playlist:", playlistId);
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/library/playlist/${playlist._id}`)}
      className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
    >
      <button
        onClick={(e) => handlePin(e, playlist._id)}
        className="absolute top-3 right-3 z-10 p-1.5 bg-background/90 text-foreground/40 hover:text-foreground shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        title="Pin Playlist"
      >
        <Pin size={14} />
      </button>

      <div className="aspect-square w-full rounded-md overflow-hidden bg-foreground/5 border border-foreground/10 flex items-center justify-center shadow-sm mb-3">
        {coverUrl ? (
          <img
            src={coverUrl}
            className="w-full h-full object-cover"
            alt={playlist.name}
          />
        ) : (
          <ListMusic size={48} className="text-foreground/30" />
        )}
      </div>
      <h3 className="font-bold text-sm text-foreground truncate">{playlist.name}</h3>
      <p className="text-xs font-medium text-foreground/50 mt-0.5">
        {trackCount === 1 ? "1 song" : `${trackCount} songs`}
      </p>
    </div>
  );
}