"use client";

import { useState, useRef, useEffect } from "react";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart, Loader2, Music, EllipsisVertical, MoreHorizontal, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";

export default function GlobalPlayer({ user }: { user?: any }) {
    const {
        isPlaying, isLoading, togglePlay, activeMetadata,
        currentTimeSec, durationSec, currentTimeStr, duration,
        seekToTime, volume, setVolume, setOnTrackEnd, queue, queueIndex
    } = useAudioEngine();

    const { playNext, playPrevious } = useGlobalPlayback();
    const playNextRef = useRef(playNext);
    useEffect(() => {
        playNextRef.current = playNext;
    }, [playNext]);

    useEffect(() => {
        if (setOnTrackEnd) {
            setOnTrackEnd(() => playNextRef.current());
        }
    }, [setOnTrackEnd]);

    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const userId = user?._id;
    const likedSongs = useQuery(api.likes.getMyLikes, userId ? { userId } : "skip");
    const isLiked = Boolean(
        activeMetadata?.id && likedSongs?.some((song: any) => song.trackId === activeMetadata.id)
    );
    const toggleLikeMutation = useMutation(api.likes.toggleLike);

    const handleLike = async () => {
        if (!activeMetadata?.id || !userId) return;
        try {
            await toggleLikeMutation({
                userId: userId as any,
                trackId: activeMetadata.id as any,
            });
        } catch (error) {
            console.error("Failed to like song:", error);
        }
    };

    const currentDragStr = isDragging
        ? `${Math.floor(dragValue / 60)}:${Math.floor(dragValue % 60).toString().padStart(2, '0')}`
        : currentTimeStr;
    const progressPercent = durationSec ? ((isDragging ? dragValue : currentTimeSec) / durationSec) * 100 : 0;

    return (
        <>
            <div className="absolute bottom-0 left-0 md:left-64 right-0 px-4 md:px-8 pb-4 md:pb-6 z-[999] pointer-events-none transition-all duration-300">
                <div className="h-[88px] w-full bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl flex items-center justify-between px-4 md:px-6 pointer-events-auto">

                    <div className="flex items-center gap-4 w-1/4 md:w-1/3 min-w-0">
                        {activeMetadata ? (
                            <>
                                <div className="w-14 h-14 bg-neutral-100 border border-neutral-200/50 rounded-2xl overflow-hidden shadow-sm shrink-0 relative group">
                                    <img onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop"
                                    }} src={activeMetadata.coverUrl} alt="C" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="hidden sm:flex items-center min-w-0 pr-4">
                                    <div className="min-w-0 pr-2">
                                        <h4 className="text-sm font-bold text-neutral-950 truncate tracking-tight">{activeMetadata.title}</h4>
                                        <p className="text-xs font-medium text-neutral-500 truncate mt-0.5">{activeMetadata.artist}</p>
                                    </div>
                                    <button
                                        onClick={handleLike}
                                        className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors focus:outline-none shrink-0"
                                    >
                                        <Heart size={18} className={cn("transition-colors", isLiked ? "text-emerald-500 fill-emerald-500" : "text-neutral-400 hover:text-neutral-900")} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-4 text-neutral-400">
                                <div className="w-14 h-14 bg-neutral-50 border border-neutral-100/80 rounded-2xl flex items-center justify-center shrink-0">
                                    <Music size={20} className="text-neutral-300" />
                                </div>
                                <div className="hidden sm:block">
                                    <h4 className="text-sm font-bold text-neutral-400 tracking-tight">Audio Engine Ready</h4>
                                    <p className="text-xs font-medium text-neutral-300 mt-0.5">Select a track to begin</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center w-2/4 md:w-1/3 gap-2.5">
                        <div className="flex items-center gap-5 md:gap-8">
                            <button onClick={playPrevious} disabled={!queue || queueIndex <= 0 && currentTimeSec <= 3} className="text-neutral-500 hover:text-neutral-700 active:scale-95 transition-all">
                                <SkipBack size={20} fill="currentColor" />
                            </button>

                            <button
                                onClick={togglePlay}
                                disabled={!activeMetadata}
                                className="w-11 h-11 bg-neutral-950 text-white rounded-full flex items-center justify-center hover:bg-neutral-800 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin text-white" />
                                ) : isPlaying ? (
                                    <Pause size={20} fill="currentColor" />
                                ) : (
                                    <Play size={20} fill="currentColor" className="ml-1" />
                                )}
                            </button>

                            <button onClick={playNext} disabled={!queue || queueIndex >= queue.length - 1} className="text-neutral-500 hover:text-neutral-700 transition-all">
                                <SkipForward size={20} fill="currentColor" />
                            </button>
                        </div>

                        <div className="w-full max-w-[400px] flex items-center gap-3 group relative">
                            <span className="text-[10px] font-bold text-neutral-400 w-9 text-right font-mono tracking-tighter">
                                {currentDragStr}
                            </span>

                            <div className="relative flex-1 flex items-center h-4 cursor-pointer">
                                <input
                                    type="range"
                                    min={0}
                                    max={durationSec || 100}
                                    value={isDragging ? dragValue : currentTimeSec}
                                    onMouseDown={() => setIsDragging(true)}
                                    onChange={(e) => setDragValue(Number(e.target.value))}
                                    onMouseUp={(e) => {
                                        setIsDragging(false);
                                        seekToTime(Number(e.currentTarget.value));
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0"
                                />
                                <div className="w-full h-1.5 bg-neutral-100 border border-neutral-200/50 rounded-full overflow-hidden group-hover:h-2 transition-all shadow-inner">
                                    <div
                                        className="h-full bg-neutral-950 rounded-full transition-all duration-75"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            <span className="text-[10px] font-bold text-neutral-400 w-9 text-left font-mono tracking-tighter">
                                {duration}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 w-1/4 md:w-1/3">
                        <div className="hidden sm:flex items-center gap-2.5 group">
                            <button
                                onClick={() => setVolume && setVolume(volume === 0 ? 0.8 : 0)}
                                className="text-neutral-400 hover:text-neutral-900 transition-colors"
                            >
                                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={volume !== undefined ? volume : 0.8}
                                onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))}
                                className="w-16 md:w-20 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-950 opacity-70 group-hover:opacity-100 transition-opacity"
                            />
                        </div>

                        <div className="relative ml-2" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                disabled={!activeMetadata?.id}
                                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <EllipsisVertical size={20} />
                            </button>
                            {isMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-3 w-48 bg-white border border-neutral-200/60 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsPlaylistModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
                                    >
                                        <ListPlus size={16} /> Add to Playlist
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddToPlaylistModal
                isOpen={isPlaylistModalOpen}
                onClose={() => setIsPlaylistModalOpen(false)}
                trackId={activeMetadata?.id || null}
            />
        </>
    );
}