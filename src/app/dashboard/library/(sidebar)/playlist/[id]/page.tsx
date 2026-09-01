"use client";

import Image from "next/image";
import { use, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import {
  Music,
} from "@/components/icons";
import { useUser } from "@/hooks/useUser";
import { Track } from "@/components/TrackComponent";
import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";
import { usePlaylistActions } from "@/components/PlaylistActions";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";

export default function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const user = useUser();
  const playlistId = resolvedParams.id as Id<"playlists">;

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { playTrack } = useGlobalPlayback();

  const playlist = useQuery(
    api.playlists.getPlaylist,
    user?._id ? { playlistId, viewerId: user._id } : { playlistId },
  );
  const tracks = useQuery(
    api.playlists.getPlaylistTracks,
    user?._id ? { playlistId, viewerId: user._id } : { playlistId },
  );

  const isLoading = playlist === undefined || tracks === undefined;

  const { handleTogglePin, openEdit, openDelete, modals, isPinned } =
    usePlaylistActions(playlist, {
      onDeleteSuccess: () => router.push("/dashboard/library"),
    });

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

  if (!playlist && !isLoading) {
    return (
      <div className="p-10 text-center text-foreground/50 bg-background">
        Playlist not found
      </div>
    );
  }

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

  const hasTracks = !!tracks && tracks.length > 0;
  const showGrid = !!tracks && tracks.length >= 4;
  const isOwner = !!playlist?.isOwner;

  const coverNode = !hasTracks ? (
    <div className="w-full h-full flex items-center justify-center bg-foreground/5">
      <Music size={48} className="text-foreground/20" />
    </div>
  ) : showGrid ? (
    <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
      {tracks!.slice(0, 4).map((t, i) => (
        <Image width={500} height={500} unoptimized
          key={i}
          src={t?.coverUrl}
          className="w-full h-full object-cover"
          alt=""
        />
      ))}
    </div>
  ) : (
    <Image width={500} height={500} unoptimized
      src={tracks![0]?.coverUrl}
      className="w-full h-full object-cover"
      alt=""
    />
  );

  return (
    <>
      <PlaylistLayout
        coverNode={coverNode}
        coverUrl={tracks?.[0]?.coverUrl}
        title={playlist?.name ?? "Playlist"}
        metaLine={
          <>
            <span className="text-foreground">
              {playlist?.isOwner
                ? user?.name || "You"
                : playlist?.ownerName || "Unknown"}
            </span>
            <span className="text-foreground/40">•</span>
            <span>
              {tracks?.length ?? 0} songs, {totalDurationStr}
            </span>
          </>
        }
        tracks={tracks}
        isLoading={isLoading}
        onPlayFirst={handlePlayFirst}
        renderTrack={(track) => (
          <Track
            key={track._id}
            track={track}
            variant="row"
            loadingId={loadingId}
            setLoadingId={setLoadingId}
            playlistId={playlistId}
          />
        )}
        isOwner={isOwner}
        isPlaylistPage={true}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {modals}
    </>
  );
}
