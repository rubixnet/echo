"use client";

import React from "react";
import { Play, Pause, Loader2, PlaySquare, ListEnd, ListPlus, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface UniversalTrackProps {
    track: any;
    variant?: "row" | "grid";
    isCurrent?: boolean;
    isLoading?: boolean;
    index?: number;
    onPlay: (track: any) => void;
    onOpenPlaylistModal: (track: any) => void;
}

export function Track({
    track,
    variant = "row",
    isCurrent = false,
    isLoading = false,
    index,
    onPlay,
    onOpenPlaylistModal,
}: UniversalTrackProps) {

    const { playNextPriority, addToQueue } = useGlobalPlayback();

    const youtubeId = track.youtubeId || track.url?.split("?v=")[1] || track.audioUrl?.split("id=")[1] || track.id;
    const coverUrl = track.thumbnail || track.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
    const title = track.title || "Unknown Track";
    const artist = track.uploaderName || track.artist || "Unknown Artist";

    const formatDuration = (duration: any) => {
        if (!duration) return "0:00";
        if (typeof duration === "number") {
            return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`;
        }
        return String(duration);
    };

    const handlePlayNext = () => {
        playNextPriority({ ...track, youtubeId, coverUrl, title, artist });
    };

    const handleAddToQueue = () => {
        addToQueue({ ...track, youtubeId, coverUrl, title, artist });
    };

    const handleShare = () => {
        const url = track.url || `https://youtube.com/watch?v=${youtubeId}`;
        navigator.clipboard.writeText(url);
    };
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    onClick={() => onPlay(track)}
                    className={cn(
                        "group cursor-pointer transition-all",
                        variant === "row"
                            ? "flex items-center justify-between py-2.5 hover:bg-neutral-100/40 px-2 -mx-2 rounded-xl"
                            : "flex flex-col space-y-3"
                    )}
                >
                    {variant === "row" ? (
                        <>
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                {index !== undefined && (
                                    <span className="w-4 text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                                        {(index + 1).toString().padStart(2, "0")}
                                    </span>
                                )}

                                <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200/40 shadow-sm bg-neutral-50 p-0.5">
                                    <img src={coverUrl} className="w-full h-full object-cover rounded-[10px] select-none" alt={title} />
                                    <div className={cn(
                                        "absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-xl",
                                        isCurrent ? "bg-black/30 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                                    )}>
                                        {isLoading ? <Loader2 size={14} className="text-white animate-spin" /> : isCurrent ? <Pause size={14} className="text-white fill-white" /> : <Play size={14} className="text-white fill-white ml-0.5" />}
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 pr-4">
                                    <p className={cn("text-sm font-bold truncate tracking-tight leading-snug", isCurrent ? "text-emerald-600" : "text-neutral-900")}>
                                        {title}
                                    </p>
                                    <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">
                                        {artist}
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs font-mono font-bold text-neutral-400 shrink-0 pr-1 group-hover:text-neutral-600 transition-colors">
                                {formatDuration(track.duration)}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-neutral-200/40 shadow-sm bg-neutral-50 p-1">
                                <img src={coverUrl} className="w-full h-full object-cover rounded-xl select-none" alt={title} />
                                <div className={cn(
                                    "absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-2xl",
                                    isCurrent ? "bg-black/30 opacity-100" : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                                )}>
                                    {isLoading ? (
                                        <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                                            <Loader2 size={20} className="text-white animate-spin" />
                                        </div>
                                    ) : isCurrent ? (
                                        <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                                            <Pause size={20} className="text-white fill-white" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                            <Play size={20} className="text-white fill-white ml-1" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-1">
                                <p className={cn("text-sm font-bold truncate tracking-tight", isCurrent ? "text-emerald-600" : "text-neutral-900")}>
                                    {title}
                                </p>
                                <p className="text-xs font-medium text-neutral-400 truncate mt-1">
                                    {artist}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </ContextMenuTrigger>


            <ContextMenuContent className="w-56 bg-white/95 backdrop-blur-xl border-neutral-200/60 shadow-xl rounded-2xl p-1.5 z-[9999]">
                <ContextMenuItem onClick={handlePlayNext} className="gap-3 cursor-pointer rounded-xl py-2.5 px-3 focus:bg-neutral-100 outline-none">
                    <PlaySquare size={16} className="text-neutral-500" />
                    <span className="font-medium text-sm text-neutral-700">Play Next</span>
                </ContextMenuItem>

                <ContextMenuItem onClick={handleAddToQueue} className="gap-3 cursor-pointer rounded-xl py-2.5 px-3 focus:bg-neutral-100 outline-none">
                    <ListEnd size={16} className="text-neutral-500" />
                    <span className="font-medium text-sm text-neutral-700">Add to Queue</span>
                </ContextMenuItem>

                <ContextMenuSeparator className="bg-neutral-100/80 my-1" />

                <ContextMenuItem
                    onClick={() => onOpenPlaylistModal(track)}
                    className="gap-3 cursor-pointer rounded-xl py-2.5 px-3 focus:bg-neutral-100 outline-none"
                >
                    <ListPlus size={16} className="text-neutral-500" />
                    <span className="font-medium text-sm text-neutral-700">Add to Playlist...</span>
                </ContextMenuItem>

                <ContextMenuSeparator className="bg-neutral-100/80 my-1" />

                <ContextMenuItem onClick={handleShare} className="gap-3 cursor-pointer rounded-xl py-2.5 px-3 focus:bg-neutral-100 outline-none">
                    <Share2 size={16} className="text-neutral-500" />
                    <span className="font-medium text-sm text-neutral-700">Share Link</span>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}