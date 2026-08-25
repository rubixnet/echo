"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, PlaySquare, ListEnd, ListPlus, Share2, Trash2, Heart } from "lucide-react";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

interface ActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    track: any | null;
    playlistId?: string;
}

export function ActionsModal({ isOpen, onClose, track, playlistId }: ActionsModalProps) {
    const { playNextPriority, addToQueue } = useGlobalPlayback();
    const user = useUser();


    const [showPlaylistModal, setShowPlaylistModal] = useState(false);

    const removeTrackFromPlaylist = useMutation(api.playlists.removeTrack);
    const toggleLikeMutation = useMutation(api.likes.toggleLike);

    const isLiked = useQuery(api.tracks.checkLiked,
        (user?._id && track?._id) ? { userId: user._id, trackId: track._id as any } : "skip"
    );

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !track) return null;

    const youtubeId = track.youtubeId || track.url?.split("?v=")[1] || track.audioUrl?.split("id=")[1] || track.id;
    const coverUrl = track.thumbnail || track.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
    const title = track.title || "Unknown Track";
    const artist = track.uploaderName || track.artist || "Unknown Artist";


    const handlePlayNext = () => {
        playNextPriority({ ...track, youtubeId, coverUrl, title, artist });
        onClose();
    };

    const handleAddToQueue = () => {
        addToQueue({ ...track, youtubeId, coverUrl, title, artist });
        onClose();
    };

    const handleShare = () => {
        const url = track.url || `https://youtube.com/watch?v=${youtubeId}`;
        navigator.clipboard.writeText(url);
        onClose();
    };

    const handleRemoveFromPlaylist = async () => {
        if (!playlistId || !track._id) return;
        try {
            await removeTrackFromPlaylist({ playlistId: playlistId as any, trackId: track._id });
            onClose();
        } catch (e) {
            console.error("Failed to remove track", e);
        }
    };

    const handleLike = async () => {
        if (!user?._id || !track._id) return;
        try {
            await toggleLikeMutation({
                userId: user._id as any,
                trackId: track._id as any,
                title,
                artist,
                coverUrl,
                duration: track.duration || "0:00",
                audioUrl: track.audioUrl || track.url || `/api/youtube/stream?id=${youtubeId}`,
            });
            onClose();
        } catch (e) {
            console.error("Failed to toggle like", e);
        }
    };

    return (
        <>
            <div className={cn(
                "fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-0",
                showPlaylistModal ? "hidden" : "visible"
            )}>

                <div
                    className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                    onClick={onClose}
                />

                <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white sm:rounded-3xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pb-6 sm:pb-0">

                    <div className="p-6 pb-4 flex items-center gap-4 border-b border-neutral-100/60">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-neutral-200/50">
                            <img
                                src={coverUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256"; }}
                            />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <h3 className="text-base font-bold text-neutral-900 truncate tracking-tight">{title}</h3>
                            <p className="text-sm font-medium text-neutral-500 truncate">{artist}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center bg-neutral-100/80 hover:bg-neutral-200/80 text-neutral-500 hover:text-neutral-900 rounded-full transition-colors shrink-0"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                    <div className="p-2 space-y-1">
                        <ActionRow icon={PlaySquare} label="Play Next" onClick={handlePlayNext} />
                        <ActionRow icon={ListEnd} label="Add to Queue" onClick={handleAddToQueue} />

                        <div className="h-px w-full bg-neutral-100/80 my-2" />

                        <ActionRow
                            icon={ListPlus}
                            label="Add to Playlist..."
                            onClick={() => setShowPlaylistModal(true)}
                        />

                        {track._id && (
                            <ActionRow
                                icon={Heart}
                                label={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
                                onClick={handleLike}
                                className={isLiked ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" : ""}
                            />
                        )}

                        <ActionRow icon={Share2} label="Share Link" onClick={handleShare} />

                        {playlistId && (
                            <>
                                <div className="h-px w-full bg-neutral-100/80 my-2" />
                                <ActionRow
                                    icon={Trash2}
                                    label="Remove from this Playlist"
                                    onClick={handleRemoveFromPlaylist}
                                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AddToPlaylistModal
                isOpen={showPlaylistModal}
                onClose={() => {
                    setShowPlaylistModal(false);
                    onClose();
                }}
                trackId={track._id || null}
            />
        </>
    );
}

function ActionRow({ icon: Icon, label, onClick, className }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80 transition-colors text-left",
                className
            )}
        >
            {label}
        </button>
    );
}

