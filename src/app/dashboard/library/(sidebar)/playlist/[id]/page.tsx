"use client";

import { use, useState, useMemo } from "react";
import { useQuery} from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { Music } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Track } from "@/components/TrackComponent";

import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const user = useUser();
  const playlistId = resolvedParams.id as string;

  const { playTrack } = useGlobalPlayback();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const playlists = useQuery(
    api.playlists.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip"
  );
  const playlist = playlists?.find((p) => p._id === playlistId);
  const tracks = useQuery(api.playlists.getPlaylistTracks, { playlistId });
  const likedSongs = useQuery(
    api.likes.getMyLikes,
    user?._id ? { userId: user._id } : "skip"
  );

  const isLoading =
    playlists === undefined || tracks === undefined || likedSongs === undefined;

  if (!playlist && !isLoading) {
    return (
      <div className="p-10 text-center text-foreground/50 bg-background">
        Playlist not found
      </div>
    );
  }

  const totalDurationStr = useMemo(() => {
    if (!tracks) return "0 min";
    const totalSeconds = tracks.reduce((acc, track) => {
      if (!track?.duration) return acc;
      const [m, s] = track.duration.split(":").map(Number);
      return acc + (m || 0) * 60 + (s || 0);
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  }, [tracks]);

  const handlePlayFirst = (sorted: TrackLike[]) => {
    const first = sorted[0];
    if (!first) return;
    playTrack(
      {
        ...first,
        youtubeId: first.audioUrl?.split("id=")[1] || first.youtubeId,
      },
      setLoadingId,
      sorted as any,
      0
    );
  };

  const hasTracks = !!tracks && tracks.length > 0;
  const showGrid = !!tracks && tracks.length >= 4;

  const coverNode = !hasTracks ? (
    <div className="w-full h-full flex items-center justify-center bg-foreground/5">
      <Music size={48} className="text-foreground/20" />
    </div>
  ) : showGrid ? (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
      {tracks!.slice(0, 4).map((t, i) => (
        <img key={i} src={t?.coverUrl} className="w-full h-full object-cover" alt="" />
      ))}
    </div>
  ) : (
    <img src={tracks![0]?.coverUrl} className="w-full h-full object-cover" alt="" />
  );

  return (
    <PlaylistLayout
      coverNode={coverNode}
      title={playlist?.name ?? "Playlist"}
      subtitle="A curated collection of tracks saved to your library."
      metaLine={
        <>
          <span className="text-foreground">{user?.name || "You"}</span>
          <span className="text-foreground/40">•</span>
          <span>
            {tracks?.length ?? 0} songs, {totalDurationStr}
          </span>
          <span className="text-foreground/40">•</span>
          <span className="text-foreground/50 font-medium">Updated just now</span>
        </>
      }
      tracks={tracks as any}
      isLoading={isLoading}
      onPlayFirst={handlePlayFirst}
      emptyIcon={<Music className="mx-auto mb-4 text-foreground/30" size={48} />}
      emptyText="This playlist is empty."
      renderTrack={(track, index, all) => (
        <Track
          key={track._id}
          track={track}
          index={index + 1}
          variant="row"
          loadingId={loadingId}
          setLoadingId={setLoadingId}
          playlistId={playlistId}
        />
      )}
    />
  );
}