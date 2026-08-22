"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import {
  X,
  Plus,
  Music,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ListPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioEngine } from "@/components/AudioProvider";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { normalizeTrack } from "@/lib/trackUtils";

function ModalPlaylistItem({
  playlist,
  trackId,
  isAdded,
  onAdd,
}: {
  playlist: any;
  trackId: string | null;
  isAdded: boolean;
  onAdd: (id: string) => void;
}) {
  const tracks = useQuery(api.playlists.getPlaylistTracks, {
    playlistId: playlist._id,
  });

  const coverUrl =
    playlist.coverUrl ||
    (tracks && tracks.length > 0 ? tracks[0]?.coverUrl : null);

  return (
    <button
      onClick={() => onAdd(playlist._id)}
      disabled={isAdded || !trackId}
      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-foreground/5 transition-colors group disabled:opacity-100 disabled:hover:bg-transparent"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors overflow-hidden border border-foreground/10",
            isAdded
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-foreground/5 text-foreground/40 group-hover:bg-foreground/10 group-hover:text-foreground/60",
          )}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              className="w-full h-full object-cover"
              alt={playlist.name}
            />
          ) : (
            <Music size={14} strokeWidth={2} />
          )}
        </div>
        <span
          className={cn(
            "font-medium capitalize text-sm text-left truncate tracking-tight transition-colors",
            isAdded
              ? "text-emerald-500"
              : "text-foreground group-hover:text-foreground",
          )}
        >
          {playlist.name}
        </span>
      </div>

      {isAdded ? (
        <CheckCircle2
          size={16}
          className="text-emerald-500 animate-in zoom-in duration-300"
        />
      ) : (
        <Plus
          size={16}
          className="text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </button>
  );
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId?: string | null;
  track?: any;
}

export function AddToPlaylistModal({
  isOpen,
  onClose,
  trackId,
  track,
}: AddToPlaylistModalProps) {
  const user = useUser();
  const { activeMetadata } = useAudioEngine();

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());

  const normalized = normalizeTrack(track || activeMetadata, "playlist");
  const effectiveTrackId = trackId || normalized.id;

  const playlists = useQuery(
    api.playlists.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip",
  );
  const createPlaylist = useMutation(api.playlists.createPlaylist);
  const addTrack = useMutation(api.playlists.addTrack);

  useEffect(() => {
    if (isOpen) {
      setAddedPlaylists(new Set());
      setNewPlaylistName("");
    }
  }, [isOpen, effectiveTrackId]);

  if (!isOpen) return null;

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!effectiveTrackId) return;
    try {
      await addTrack({
        playlistId: playlistId as any,
        trackId: effectiveTrackId,
        title: normalized.title,
        artist: normalized.artist,
        coverUrl: normalized.coverUrl,
        duration: normalized.duration,
        audioUrl: normalized.audioUrl,
        source: normalized.source,
      });
      setAddedPlaylists((prev) => new Set(prev).add(playlistId));
    } catch (error) {
      console.error("Failed to add track to playlist", error);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user?._id) return;

    setIsCreating(true);
    try {
      const playlistId = await createPlaylist({
        name: newPlaylistName,
        userId: user._id,
      });

      if (effectiveTrackId) {
        await handleAddToPlaylist(playlistId);
      }
      setNewPlaylistName("");
    } catch (error) {
      console.error("Failed to create playlist", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        <LiquidPanel radius="24px">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/70">
                  <ListPlus size={16} strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-lg text-foreground tracking-tight">
                  Add to Playlist
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {normalized.id ? (
              <div className="flex items-center gap-3 bg-foreground/5 p-2 rounded-xl border border-foreground/5">
                <img
                  src={normalized.coverUrl}
                  alt="Cover"
                  className="w-10 h-10 rounded-lg object-cover shadow-sm border border-foreground/5"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop";
                  }}
                />
                <div className="min-w-0 pr-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {normalized.title}
                  </p>
                  <p className="text-xs font-medium text-foreground/50 truncate">
                    {normalized.artist}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-rose-500/10 text-rose-500 p-3 rounded-xl">
                <AlertCircle size={16} />
                <p className="text-xs font-semibold">
                  Please wait for the track to load.
                </p>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 space-y-5">
            <form
              onSubmit={handleCreatePlaylist}
              className="flex w-full items-center gap-2"
            >
              <div className="flex-1 w-full">
                <LiquidContainer
                  radius="12px"
                  className="w-full flex-1"
                  style={{ width: "100%" }}
                >
                  <input
                    type="text"
                    placeholder="New playlist..."
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 h-9 text-sm font-medium text-foreground focus:outline-none focus:border-foreground/30 placeholder:text-foreground/40 transition-colors"
                  />
                </LiquidContainer>
              </div>

              <LiquidContainer radius="12px">
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim() || isCreating}
                  className="h-9 px-4 text-sm font-medium text-primary focus:outline-none disabled:text-primary/80 focus:border-foreground/30 placeholder:text-foreground/40 transition-colors"
                >
                  {isCreating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Create"
                  )}
                </button>
              </LiquidContainer>
            </form>

            <div className="flex flex-col gap-1.5">
              <h4 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest px-1 mb-1">
                Your Playlists
              </h4>

              <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 liquid-scroll -mx-2 px-2">
                {playlists === undefined ? (
                  <div className="flex justify-center py-6">
                    <Loader2
                      size={20}
                      className="animate-spin text-foreground/30"
                    />
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-6 text-foreground/40 font-medium text-xs">
                    No playlists created yet.
                  </div>
                ) : (
                  playlists.map((playlist) => (
                    <ModalPlaylistItem
                      key={playlist._id}
                      playlist={playlist}
                      trackId={effectiveTrackId}
                      isAdded={addedPlaylists.has(playlist._id)}
                      onAdd={handleAddToPlaylist}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </LiquidPanel>
      </div>
    </div>
  );
}
