"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useUser } from "@/hooks/useUser";
import { Track } from "@/components/TrackComponent";
import {
  Star,
} from "@/components/icons";

import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";

export default function LikedSongsPage() {
  const user = useUser();
  const { playTrack } = useGlobalPlayback();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const playlists = useQuery(
    api.playlists.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip",
  );
  const likedSongs = useQuery(
    api.likes.getMyLikes,
    user?._id ? { userId: user._id } : "skip",
  );

  const isLoading = playlists === undefined || likedSongs === undefined;

  const totalDurationStr = useMemo(() => {
    if (!likedSongs) return "0 min";
    const totalSeconds = likedSongs.reduce((acc, track) => {
      if (!track?.duration) return acc;
      const [m, s] = track.duration.split(":").map(Number);
      return acc + (m || 0) * 60 + (s || 0);
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  }, [likedSongs]);

  const handlePlayFirst = (sorted: TrackLike[]) => {
    const first = sorted[0];
    if (!first) return;
    playTrack(
      {
        ...first,
        trackId: first.audioUrl?.split("id=")[1] || first.trackId,
      },
      setLoadingId,
      sorted,
      0,
    );
  };

  const coverNode = (
    <div className="w-full h-full bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center">
      <Star size={125} solid className="text-white" />
    </div>
  );

  return (
    <PlaylistLayout
      coverNode={coverNode}
      title="Favorite Songs"
      metaLine={
        <>
          <span className="text-foreground">{user?.name || "You"}</span>
          <span className="text-foreground/40">•</span>
          <span>
            {likedSongs?.length ?? 0} songs, {totalDurationStr}
          </span>
        </>
      }
      tracks={likedSongs}
      isLoading={isLoading}
      onPlayFirst={handlePlayFirst}
      emptyIcon={<Star className="mx-auto mb-4 text-foreground/30" size={48} />}
      emptyText="No favorite songs yet."
      renderTrack={(track, _allTracks, index) => (
        <Track
          key={track._id}
          track={track}
          index={index + 1}
          variant="row"
          loadingId={loadingId}
          setLoadingId={setLoadingId}
        />
      )}
    />
  );
}
