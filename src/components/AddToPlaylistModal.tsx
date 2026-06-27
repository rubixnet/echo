"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { X, Plus, Music, Loader2, CheckCircle2, AlertCircle, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAudioEngine } from "@/components/AudioProvider";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string | null;
}

export function AddToPlaylistModal({ isOpen, onClose, trackId }: AddToPlaylistModalProps) {
  const user = useUser();
  const { activeMetadata } = useAudioEngine();

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set());

  const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip");
  const createPlaylist = useMutation(api.playlists.createPlaylist);
  const addTrack = useMutation(api.playlists.addTrack);

  useEffect(() => {
    if (isOpen) {
      setAddedPlaylists(new Set());
      setNewPlaylistName("");
    }
  }, [isOpen, trackId]);

  if (!isOpen) return null;

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !user?._id) return;

    setIsCreating(true);
    try {
      const playlistId = await createPlaylist({
        name: newPlaylistName,
        userId: user._id,
      });

      if (trackId) {
        await addTrack({ playlistId, trackId: trackId as any });
        setAddedPlaylists((prev) => new Set(prev).add(playlistId));
      }
      setNewPlaylistName("");
    } catch (error) {
      console.error("Failed to create playlist", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!trackId) return;
    try {
      const result = await addTrack({ playlistId: playlistId as any, trackId: trackId as any });
      if (result.success || result.message === "Track already in playlist") {
        setAddedPlaylists((prev) => new Set(prev).add(playlistId));
      }
    } catch (error) {
      console.error("Failed to add track", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-neutral-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white/90 backdrop-blur-2xl border border-white big-squircle shadow-[0_8px_40px_rgb(0,0,0,0.12)] w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">

        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                <ListPlus size={16} className="text-neutral-600" />
              </div>
              <h3 className="font-black text-xl text-neutral-950 tracking-tight">Add to Playlist</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-neutral-100/80 hover:bg-neutral-200/80 rounded-full text-neutral-500 hover:text-neutral-900 transition-colors">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {activeMetadata ? (
            <div className="flex items-center gap-4 bg-white/60 p-2.5 squircle border border-neutral-200/50 shadow-sm backdrop-blur-md">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                <img
                  src={activeMetadata.coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop"; }}
                />
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl pointer-events-none" />
              </div>
              <div className="min-w-0 pr-2">
                <p className="text-sm font-bold text-neutral-900 truncate tracking-tight">{activeMetadata.title}</p>
                <p className="text-xs font-medium text-neutral-500 truncate">{activeMetadata.artist}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-rose-50/80 text-rose-600 p-3 rounded-2xl border border-rose-100/50 backdrop-blur-sm">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">Please wait for the track to fully load.</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 space-y-6">

          <form onSubmit={handleCreatePlaylist} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Create a new playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 bg-white border border-neutral-200/60 squircle px-4 h-10 text-sm font-medium focus:outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim() || isCreating}
              className="h-10 px-4 bg-neutral-950 text-white squircle flex items-center justify-center font-bold text-sm hover:bg-neutral-800 transition-all disabled:opacity-50 shrink-0 shadow-sm active:scale-99"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : "Create"}
            </button>
          </form>
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1 mb-2">Save to existing</h4>

            <div className="max-h-[220px] overflow-y-auto space-y-1 pr-2 scrollbar-hide -mx-2 px-2">
              {playlists === undefined ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-neutral-300" />
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200/50 text-neutral-400 font-medium text-sm">
                  No playlists created yet.
                </div>
              ) : (
                playlists.map((playlist) => {
                  const isAdded = addedPlaylists.has(playlist._id);

                  return (
                    <button
                      key={playlist._id}
                      onClick={() => handleAddToPlaylist(playlist._id)}
                      disabled={isAdded || !trackId}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100/80 transition-all group disabled:opacity-100 disabled:hover:bg-transparent"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 squircle flex items-center justify-center shrink-0 transition-all shadow-sm",
                          isAdded ? "bg-emerald-100 border border-emerald-200 text-emerald-600" : "bg-white border border-neutral-200 text-neutral-400 group-hover:border-neutral-300 group-hover:text-neutral-600"
                        )}>
                          <Music size={16} />
                        </div>
                        <span className={cn("font-bold text-sm text-left truncate tracking-tight transition-colors", isAdded ? "text-emerald-700" : "text-neutral-700 group-hover:text-neutral-950")}>
                          {playlist.name}
                        </span>
                      </div>

                      {isAdded ? (
                        <CheckCircle2 size={18} className="text-emerald-500 animate-in zoom-in duration-300" />
                      ) : (
                        <Plus size={18} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}