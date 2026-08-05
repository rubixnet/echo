"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Music } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { Track } from "@/components/TrackComponent";
import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";
import { usePlaylistActions } from "@/components/PlaylistActions";

export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const user = useUser();
  const playlistId = resolvedParams.id as Id<"playlists">;
  
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip");
  const tracks = useQuery(api.playlists.getPlaylistTracks, { playlistId });
  const playlist = playlists?.find((p) => p._id === playlistId);

  const isLoading = playlists === undefined || tracks === undefined;

  const { handleTogglePin, openEdit, openDelete, modals, isPinned } = usePlaylistActions(
    playlist, 
    { onDeleteSuccess: () => router.push("/dashboard/library") } 
  );

  if (!playlist && !isLoading) {
    return <div className="p-10 text-center text-foreground/50 bg-background">Playlist not found</div>;
  }

  const handlePlayFirst = (sorted: TrackLike[]) => { /* ... */ };

  const hasTracks = !!tracks && tracks.length > 0;
  const showGrid = !!tracks && tracks.length >= 4;
  const isOwner = !!user && !!playlist && playlist.userId === user._id;

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
    <>
      <PlaylistLayout
        coverNode={coverNode}
        title={playlist?.name ?? "Playlist"}
        tracks={tracks as any}
        isLoading={isLoading}
        onPlayFirst={handlePlayFirst}
        renderTrack={(track, index) => (
          <Track key={track._id} track={track} index={index + 1} variant="row" loadingId={loadingId} setLoadingId={setLoadingId} playlistId={playlistId} />
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