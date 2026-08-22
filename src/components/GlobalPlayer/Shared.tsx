"use client";

import { useState, useRef, useEffect } from "react";
import { useAudioEngine } from "@/components/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { useRoomState } from "@/hooks/useRoomState";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Radio,
  ListMusic,
  Shuffle,
  Repeat,
  Star,
  Loader2,
} from "lucide-react";
import { fetchRelatedTracks } from "@/lib/recommendations";

export function ProgressBar({
  heightClass = "h-1.5",
  hoverHeightClass = "group-hover/timeline:h-2",
}: {
  heightClass?: string;
  hoverHeightClass?: string;
}) {
  const { currentTimeSec, durationSec, duration, currentTimeStr, seekToTime } =
    useAudioEngine();
  const { isGuest } = useRoomState();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const progressPercent = durationSec
    ? ((isDragging ? dragValue : currentTimeSec) / durationSec) * 100
    : 0;
  const currentDragStr = isDragging
    ? `${Math.floor(dragValue / 60)}:${Math.floor(dragValue % 60)
        .toString()
        .padStart(2, "0")}`
    : currentTimeStr;

  return (
    <div className="flex items-center gap-2 w-full group/timeline">
      <span className="text-[9px] font-medium text-foreground/50 tabular-nums min-w-[28px]">
        {currentDragStr}
      </span>

      <div
        className={cn(
          "relative flex-1 flex items-center h-2",
          !isGuest && "cursor-pointer",
        )}
      >
        {!isGuest && (
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
        )}

        <div
          className={cn(
            "w-full bg-foreground/10 rounded-full overflow-hidden transition-all",
            heightClass,
            !isGuest && hoverHeightClass,
          )}
        >
          <div
            className="h-full bg-foreground rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <span className="text-[9px] font-medium text-foreground/50 tabular-nums min-w-[28px]">
        {duration}
      </span>
    </div>
  );
}

export function Timeline({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 w-full", className)}>
      <ProgressBar
        heightClass="h-1.5"
        hoverHeightClass="group-hover/timeline:h-2"
      />
    </div>
  );
}

export function PlaybackControls({
  className,
  iconSize = 28,
}: {
  className?: string;
  iconSize?: number;
}) {
  const {
    isPlaying,
    isLoading,
    togglePlay,
    activeMetadata,
    isOnLoop,
    setIsOnLoop,
    currentTimeSec,
    queue,
    queueIndex,
  } = useAudioEngine();
  const { playNext, playPrevious } = useGlobalPlayback();
  const { isGuest } = useRoomState();

  if (isGuest) {
    return (
      <div className={cn("flex items-center justify-center py-2", className)}>
        <button
          onClick={() =>
            window.dispatchEvent(new CustomEvent("openLockdownModal"))
          }
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors rounded-full border border-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <Radio size={16} className="animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Live • Leave Room
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center gap-6", className)}>
      <button className="text-foreground/40 hover:text-foreground transition-colors max-md:hidden">
        <Shuffle size={iconSize * 0.7} strokeWidth={2} />
      </button>
      <button
        onClick={playPrevious}
        disabled={!queue || (queueIndex <= 0 && currentTimeSec <= 3)}
        className="text-foreground/80 hover:text-foreground active:scale-95 transition-transform disabled:opacity-30"
      >
        <SkipBack size={iconSize} fill="currentColor" strokeWidth={1} />
      </button>
      <button
        onClick={togglePlay}
        className="w-16 h-16 flex items-center justify-center bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-transform shadow-xl"
      >
        {isLoading ? (
          <Loader2
            size={iconSize}
            className="animate-spin text-background"
            strokeWidth={3}
          />
        ) : isPlaying ? (
          <Pause size={iconSize} fill="currentColor" strokeWidth={1} />
        ) : (
          <Play
            size={iconSize}
            fill="currentColor"
            strokeWidth={1}
            className="ml-1"
          />
        )}
      </button>
      <button
        onClick={() => playNext(false)}
        disabled={!activeMetadata}
        className="text-foreground/80 hover:text-foreground active:scale-95 transition-transform disabled:opacity-30"
      >
        <SkipForward size={iconSize} fill="currentColor" strokeWidth={1} />
      </button>
      <button
        onClick={() => setIsOnLoop(!isOnLoop)}
        className={cn(
          "transition-colors max-md:hidden",
          isOnLoop
            ? "text-emerald-500"
            : "text-foreground/40 hover:text-foreground",
        )}
      >
        <Repeat size={iconSize * 0.7} strokeWidth={2} />
      </button>
    </div>
  );
}

export function StarButton({ className }: { className?: string }) {
  const user = useUser();
  const { activeMetadata } = useAudioEngine();
  const userId = user?._id;

  const likedSongs = useQuery(
    api.likes.getMyLikes,
    userId ? { userId } : "skip",
  );
  const isLiked = Boolean(
    activeMetadata?.id &&
    likedSongs?.some((song: any) => song.trackId === activeMetadata.id),
  );
  const toggleLikeMutation = useMutation(api.likes.toggleLike);

  const handleLike = async () => {
    if (!activeMetadata?.id || !userId) return;

    const durationStr =
      typeof activeMetadata.duration === "number"
        ? `${Math.floor(activeMetadata.duration / 60)}:${(activeMetadata.duration % 60).toString().padStart(2, "0")}`
        : activeMetadata.duration || "0:00";

    try {
      await toggleLikeMutation({
        userId: userId as any,
        trackId: activeMetadata.id as any,
        title: activeMetadata.title || "Unknown Track",
        artist:
          activeMetadata.artist ||
          activeMetadata.uploaderName ||
          "Unknown Artist",
        coverUrl:
          activeMetadata.coverUrl ||
          activeMetadata.thumbnail ||
          "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256",
        duration: durationStr,
        audioUrl: activeMetadata.audioUrl || "",
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={!activeMetadata?.id}
      className={cn("p-2 transition-colors disabled:opacity-50", className)}
    >
      <Star
        size={24}
        strokeWidth={2}
        className={cn(
          "transition-colors",
          isLiked
            ? "text-emerald-500 fill-emerald-500"
            : "text-foreground/70 hover:text-foreground",
        )}
      />
    </button>
  );
}

export function useNextInQueue(limit: number = 4) {
  const { queue, queueIndex, setQueue, activeMetadata } = useAudioEngine();
  const [isFetching, setIsFetching] = useState(false);

  const isFetchingRef = useRef(false);
  const fetchedForIdRef = useRef<string | null>(null);

  const upcomingTracks = queue
    ? queue.slice(queueIndex + 1, queueIndex + 1 + limit)
    : [];

  useEffect(() => {
    const currentId =
      activeMetadata?.youtubeId ||
      activeMetadata?.id ||
      activeMetadata?.audioUrl?.split("id=")[1];

    if (
      upcomingTracks.length === 0 &&
      currentId &&
      !isFetchingRef.current &&
      fetchedForIdRef.current !== currentId
    ) {
      isFetchingRef.current = true;
      fetchedForIdRef.current = currentId;
      setIsFetching(true);

      fetchRelatedTracks(currentId, queue || [])
        .then((recommendations) => {
          if (recommendations && recommendations.length > 0) {
            const songsToAdd = recommendations.slice(0, 5);
            const currentQueue =
              queue || (activeMetadata ? [activeMetadata] : []);

            setQueue([...currentQueue, ...songsToAdd]);
          }
        })
        .catch((error) => {
          console.error(
            "[useNextInQueue] Failed to pre-fetch related tracks:",
            error,
          );
        })
        .finally(() => {
          isFetchingRef.current = false;
          setIsFetching(false);
        });
    }
  }, [
    activeMetadata?.youtubeId,
    activeMetadata?.id,
    activeMetadata?.audioUrl,
    upcomingTracks.length,
    queue,
    setQueue,
  ]);

  return { upNextTracks: upcomingTracks, isFetching };
}

export function PlaybackStatus({ isFetching }: { isFetching?: boolean }) {
  const { activeMetadata } = useAudioEngine();
  const source = activeMetadata?.source;

  if (source?.type === "playlist") {
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
    <div className="shrink-0 flex items-center gap-4">
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

export function useDominantColor(
  imageUrl?: string,
): [number, number, number] | null {
  const [rgb, setRgb] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setRgb(null);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl.includes("?")
      ? `${imageUrl}&cors=1`
      : `${imageUrl}?cors=1`;

    const extractVibrantColor = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const size = 24;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        let bestColor: [number, number, number] | null = null;
        let highestScore = -1;
        let avgR = 0,
          avgG = 0,
          avgB = 0,
          count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue;

          avgR += r;
          avgG += g;
          avgB += b;
          count++;

          const max = Math.max(r, g, b) / 255;
          const min = Math.min(r, g, b) / 255;
          const lum = (max + min) / 2;

          if (lum < 0.12 || lum > 0.88) continue;

          const sat =
            max === min
              ? 0
              : lum < 0.5
                ? (max - min) / (max + min)
                : (max - min) / (2 - max - min);
          if (sat < 0.15) continue;

          const score = sat * 1.5 + (1 - Math.abs(lum - 0.5));

          if (score > highestScore) {
            highestScore = score;
            bestColor = [r, g, b];
          }
        }

        if (isMounted) {
          if (bestColor) {
            setRgb(bestColor);
          } else if (count > 0) {
            setRgb([
              Math.round(avgR / count),
              Math.round(avgG / count),
              Math.round(avgB / count),
            ]);
          }
        }
      } catch (err) {
        if (isMounted) setRgb(null);
      }
    };

    if (img.complete) {
      extractVibrantColor();
    } else {
      img.onload = extractVibrantColor;
      img.onerror = () => {
        if (isMounted) setRgb(null);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return rgb;
}

export function VibrantBackground({
  imageUrl,
  opacity = 0.85,
}: {
  imageUrl?: string;
  opacity?: number;
}) {
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
          opacity,
        } as React.CSSProperties
      }
    />
  );
}
