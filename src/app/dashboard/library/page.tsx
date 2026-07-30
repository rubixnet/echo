"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Loader2, Pin, Trash2, MoreVertical, Heart, History, Plus, ListMusic } from "lucide-react";
import { Track } from "@/components/TrackComponent";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropodown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";

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

  const pinnedPlaylist = playlists.filter((p) => p.isPinned);

  return (
    <div className="px-6 lg:px-12 py-10 space-y-12 bg-background text-foreground max-w-7xl mx-auto">
      {pinnedPlaylist.length > 0 &&
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Pins</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {pinnedPlaylist.map((p) => (
              <LibraryPlaylistItem key={p._id} playlist={p} />
            ))}
          </div>
        </section>
      }

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Your Library</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          <div
            // onClick={()}
            className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
          >

            <div className="aspect-square w-full rounded-md border-2 border-dashed border-foreground/20 bg-foreground/5 hover:bg-foreground/10 hover:border-foreground/40 flex flex-col items-center justify-center gap-2 shadow-sm mb-3 transition-all">
              <div className="p-3 rounded-full bg-foreground/10 text-foreground">
                <Plus size={28} />
              </div>
            </div>
            <h3 className="font-bold text-sm text-foreground truncate">Create New Playlist</h3>
          </div>

          {historySongs.length > 0 && (
            <div
              onClick={() => router.push(`/dashboard/library/history`)}
              className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
            >
              <div className="aspect-square w-full rounded-md overflow-hidden bg-radial-[at_top_left] from-cyan-400 via-teal-700 to-slate-950 flex items-center justify-center shadow-sm mb-3">
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
              <div className="aspect-square w-full rounded-md overflow-hidden bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-sm mb-3">
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
  const [isPending, setIsPending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const togglePinned = useMutation(api.playlists.togglePinned);
  const deletePlaylist = useMutation(api.playlists.deletePlaylist);

  const tracks = useQuery(api.playlists.getPlaylistTracks, {
    playlistId: playlist._id,
  });

  const trackCount = tracks?.length || 0;
  const coverUrl =
    playlist.coverUrl ||
    (tracks && tracks.length > 0 ? tracks[0]?.coverUrl : null);

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsPending(true);
      await togglePinned({ playlistId: playlist._id });
    } catch (error) {
      console.error("Failed to toggle pin state:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsPending(true);
      await deletePlaylist({ playlistId: playlist._id });
    } catch (error) {
      console.error("Failed to delete playlist:", error);
    } finally {
      setIsPending(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        onClick={() => router.push(`/dashboard/library/playlist/${playlist._id}`)}
        className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
      >
        <div className="relative aspect-square w-full rounded-md overflow-hidden bg-foreground/5 border border-foreground/10 flex items-center justify-center shadow-sm mb-3">
          {coverUrl ? (
            <img
              src={coverUrl}
              className="w-full h-full object-cover"
              alt={playlist.name}
            />
          ) : (
            <ListMusic size={48} className="text-foreground/30" />
          )}

          {playlist.isPinned && (
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-md p-1.5 rounded-full shadow-md text-foreground">
              <Pin size={12} className="fill-current" />
            </div>
          )}
        </div>

        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-foreground truncate">{playlist.name}</h3>
            <p className="text-xs font-medium text-foreground/50 mt-0.5">
              {trackCount === 1 ? "1 song" : `${trackCount} songs`}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 -mr-1 text-foreground/50 hover:text-foreground rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                aria-label="Playlist options"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={handlePinToggle}
                disabled={isPending}
                className="cursor-pointer gap-2 focus:bg-foreground/10"
              >
                <Pin size={14} className={playlist.isPinned ? "fill-current" : ""} />
                <span>{playlist.isPinned ? "Unpin Playlist" : "Pin Playlist"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                disabled={isPending}
                className="cursor-pointer gap-2 text-primary bg-destructive/20"
              >
                <Trash2 size={14} />
                <span>Delete Playlist</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{playlist.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}