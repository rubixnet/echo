"use client";

import { useState, useEffect } from "react";
import { useAudioEngine } from "@/components/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { Play, Pause, SkipForward, SkipBack, Radio, ListMusic, Shuffle, Repeat, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Timeline({ className }: { className?: string }) {
    const { currentTimeSec, durationSec, duration, currentTimeStr, seekToTime } = useAudioEngine();
    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);

    const progressPercent = durationSec ? ((isDragging ? dragValue : currentTimeSec) / durationSec) * 100 : 0;

    const currentDragStr = isDragging
        ? `${Math.floor(dragValue / 60)}:${Math.floor(dragValue % 60).toString().padStart(2, '0')}`
        : currentTimeStr;

    return (
        <div className={cn("flex items-center gap-3 w-full group/timeline", className)}>
            <span className="text-xs font-bold text-foreground/50 tabular-nums min-w-[36px]">{currentDragStr}</span>
            <div className="relative flex-1 flex items-center h-2 cursor-pointer">
                <input
                    type="range" min={0} max={durationSec || 100}
                    value={isDragging ? dragValue : currentTimeSec}
                    onMouseDown={() => setIsDragging(true)}
                    onChange={(e) => setDragValue(Number(e.target.value))}
                    onMouseUp={(e) => {
                        setIsDragging(false);
                        seekToTime(Number(e.currentTarget.value));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0"
                />
                <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden group-hover/timeline:h-2 transition-all">
                    <div className="h-full bg-foreground rounded-full transition-all duration-75 relative" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>
            <span className="text-xs font-bold text-foreground/50 tabular-nums min-w-[36px] text-right">{duration}</span>
        </div>
    );
}

export function PlaybackControls({ className, iconSize = 28 }: { className?: string, iconSize?: number }) {
    const { isPlaying, isLoading, togglePlay, activeMetadata, isOnLoop, setIsOnLoop, currentTimeSec, queue, queueIndex } = useAudioEngine();
    const { playNext, playPrevious } = useGlobalPlayback();

    return (
        <div className={cn("flex items-center justify-center gap-6", className)}>
            <button className="text-foreground/40 hover:text-foreground transition-colors max-md:hidden"><Shuffle size={iconSize * 0.7} strokeWidth={2} /></button>
            <button onClick={playPrevious} disabled={!queue || queueIndex <= 0 && currentTimeSec <= 3} className="text-foreground/80 hover:text-foreground active:scale-95 transition-transform disabled:opacity-30">
                <SkipBack size={iconSize} fill="currentColor" strokeWidth={1} />
            </button>
            <button
                onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-transform shadow-xl"
            >
                {isLoading ? (
                    <Loader2 size={iconSize} className="animate-spin text-background" strokeWidth={3} />
                ) : isPlaying ? (
                    <Pause size={iconSize} fill="currentColor" strokeWidth={1} />
                ) : (
                    <Play size={iconSize} fill="currentColor" strokeWidth={1} className="ml-1" />
                )}
            </button>
            <button onClick={() => playNext(false)} disabled={!activeMetadata} className="text-foreground/80 hover:text-foreground active:scale-95 transition-transform disabled:opacity-30">
                <SkipForward size={iconSize} fill="currentColor" strokeWidth={1} />
            </button>
            <button onClick={() => setIsOnLoop(!isOnLoop)} className={cn("transition-colors max-md:hidden", isOnLoop ? "text-emerald-500" : "text-foreground/40 hover:text-foreground")}>
                <Repeat size={iconSize * 0.7} strokeWidth={2} />
            </button>
        </div>
    );
}

export function LikeButton({ className }: { className?: string }) {
    const user = useUser();
    const { activeMetadata } = useAudioEngine();
    const userId = user?._id;

    const likedSongs = useQuery(api.likes.getMyLikes, userId ? { userId } : "skip");
    const isLiked = Boolean(activeMetadata?.id && likedSongs?.some((song: any) => song.trackId === activeMetadata.id));
    const toggleLikeMutation = useMutation(api.likes.toggleLike);

    const handleLike = async () => {
        if (!activeMetadata?.id || !userId) return;
        try { await toggleLikeMutation({ userId: userId as any, trackId: activeMetadata.id as any }); }
        catch (error) { console.error(error); }
    };

    return (
        <button onClick={handleLike} disabled={!activeMetadata} className={cn("p-2 transition-colors disabled:opacity-50", className)}>
            <Heart size={24} strokeWidth={2} className={cn("transition-colors", isLiked ? "text-emerald-500 fill-emerald-500" : "text-foreground/70 hover:text-foreground")} />
        </button>
    );
}
export function useNextInQueue(limit: number = 4) {
    const { queue, queueIndex, setQueue, activeMetadata } = useAudioEngine();
    const [isFetching, setIsFetching] = useState(false);
    const [fetchedForId, setFetchedForId] = useState<string | null>(null);

    const upcomingTracks = queue ? queue.slice(queueIndex + 1, queueIndex + 1 + limit) : [];

    useEffect(() => {
        const currentId = activeMetadata?.youtubeId || activeMetadata?.audioUrl?.split("id=")[1];

        if (upcomingTracks.length === 0 && currentId && currentId !== fetchedForId && !isFetching) {

            const preFetchRelated = async () => {
                setIsFetching(true);
                try {
                    const res = await fetch(`/api/youtube/related?id=${currentId}`);
                    const data = await res.json();

                    if (data.items && data.items.length > 0) {
                        const validSongs = data.items.filter((item: any) =>
                            item.id !== currentId && item.youtubeId !== currentId
                        );

                        const songsToAdd = validSongs.slice(0, 5);

                        if (songsToAdd.length > 0) {
                            setQueue((prevQueue: any[]) => [...(prevQueue || []), ...songsToAdd]);
                        }

                        setFetchedForId(currentId);
                    }
                } catch (error) {
                    console.error("Failed to pre-fetch related tracks", error);
                } finally {
                    setIsFetching(false);
                }
            };

            preFetchRelated();
        }
    }, [activeMetadata, upcomingTracks.length, isFetching, fetchedForId, setQueue]);

    return {
        upNextTracks: upcomingTracks,
        isFetching
    };
}

export function PlaybackStatus({ isFetching }: { isFetching?: boolean }) {
    const { activeMetadata } = useAudioEngine();
    const source = activeMetadata?.source;

    if (source?.type === 'playlist') {
        return (
            <div className="shrink-0 mb-6 flex items-center gap-4 bg-foreground/5 p-4 rounded-2xl border border-foreground/5">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md bg-neutral-200">
                    <img
                        src={source.coverUrl || activeMetadata?.coverUrl}
                        alt={source.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-0.5">
                        Playing from Playlist
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">
                        {source.name}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="shrink-0 flex items-center gap-4 ">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                {isFetching ? <Radio size={24} /> : <ListMusic size={24} />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground/50 tracking-wide mb-0.5">
                    Playing From
                </p>
                <p className="text-sm text-primary font-bold truncate">
                    {isFetching ? "Dynamic Recommendations" : "Your Queue"}
                </p>
            </div>
        </div>
    );
}

export function useDominantColor(imageUrl?: string) {
    const [rgb, setRgb] = useState<[number, number, number] | null>(null);

    useEffect(() => {
        if (!imageUrl) {
            setRgb(null);
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (ctx) {
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                setRgb([r, g, b]);
            }
        };
    }, [imageUrl]);

    return rgb;
}

export function VibrantBackground({ imageUrl }: { imageUrl?: string }) {
    const rgb = useDominantColor(imageUrl);

    const dominantColor = rgb
        ? `rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`
        : "var(--background)";

    return (
        <div
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000 ease-out"
            style={
                {
                    "--dominant-color": dominantColor,
                    backgroundImage: `
            linear-gradient(
              to bottom in oklch,
              oklch(from var(--dominant-color) l c h / 0.85) 0%,
              var(--background) 92%
            )
          `,
                    opacity: 0.85,
                } as React.CSSProperties
            }
        />
    );
}