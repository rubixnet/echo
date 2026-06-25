"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser"
import { X, Plus, Music, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from '@/lib/utils'

interface AddToPlaylistsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trackId: string | null
}

export function AddToPlaylistModal({
    isOpen, onClose, trackId
}:
    AddToPlaylistsModalProps
) {
    const user = useUser();
    const [newPlaylistName, setNewPlaylistName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [addedPlaylists, setAddedPlaylists] = useState<Set<string>>(new Set())

    const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip");
    const createPlaylist = useMutation(api.playlists.createPlaylist);
    const addTrack = useMutation(api.playlists.addTrack)

    if (!isOpen || !trackId) return null;


    const handleCreatePlaylist = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newPlaylistName.trim() || !user?._id) return;

        setIsCreating(true)
        try {
            const playlistId = await createPlaylist({
                name: newPlaylistName,
                userId: user._id,
            })


            await addTrack({
                playlistId, trackId: trackId as any,
            })

            setAddedPlaylists((prev) => new Set(prev).add(playlistId))
            setNewPlaylistName("")
        } catch (error) {
            console.error("Failed to create playlist", error);
        } finally {
            setIsCreating(false)
        }
    }

    const handleAddToPlaylist = async (playlistId: string) => {
        if (!trackId) return;
        try {
            const result = await addTrack({ playlistId: playlistId as any, trackId: trackId as any });
            if (result.success) {
                setAddedPlaylists((prev) => new Set(prev).add(playlistId));
            }
        } catch (error) {
            console.error("Failed to add track", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-neutral-900">Add to Playlist</h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-6">

                    <form onSubmit={handleCreatePlaylist} className="flex items-center gap-2">

                        <input
                            type="text"
                            placeholder="New playlist name..."
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 h-11 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
                        />
                        <button
                            type="submit"
                            disabled={!newPlaylistName.trim() || isCreating}
                            className="h-11 w-11 bg-neutral-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors disabled:opacity-50 shrink-0"
                        >
                            {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
                        </button>
                    </form>

                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 px-1">Your Library</h4>

                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1 scrollbar-hide">
                            {playlists === undefined ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 size={24} className="animate-spin text-neutral-300" />
                                </div>
                            ) : playlists.length === 0 ? (
                                <div className="text-center py-6 text-neutral-400 font-medium text-sm">
                                    No playlists yet.
                                </div>
                            ) : (
                                playlists.map((playlist) => {
                                    const isAdded = addedPlaylists.has(playlist._id);

                                    return (
                                        <button
                                            key={playlist._id}
                                            onClick={() => handleAddToPlaylist(playlist._id)}
                                            disabled={isAdded}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors group disabled:opacity-70 disabled:hover:bg-transparent"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-neutral-100 border border-neutral-200/60 rounded-lg flex items-center justify-center shrink-0">
                                                    <Music size={16} className="text-neutral-400" />
                                                </div>
                                                <span className="font-bold text-sm text-neutral-800 text-left truncate">
                                                    {playlist.name}
                                                </span>
                                            </div>

                                            {isAdded ? (
                                                <CheckCircle2 size={18} className="text-emerald-500" />
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