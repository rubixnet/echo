"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useRoomState } from "@/hooks/useRoomContext";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  ChevronDown,
  Loader2,
  Music,
  ListMusic,
  EllipsisVertical,
  Mic2,
  ListPlus,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import {
  Timeline,
  StarButton,
  useNextInQueue,
  PlaybackStatus,
  useDominantColor,
} from "./Shared";
import { SyncedLyrics } from "@/components/SyncedLyrics";
import { cn } from "@/lib/utils";
import { Track } from "../TrackComponent";
import { TrackDropdownMenu } from "./TrackActionsMenu";

export function MobilePlayer({
  setIsPlaylistModalOpen,
}: {
  setIsPlaylistModalOpen: (v: boolean) => void;
}) {
  const {
    activeMetadata,
    isPlaying,
    isLoading,
    currentTimeSec,
    durationSec,
    isOnLoop,
    setIsOnLoop,
    queue,
    queueIndex,
  } = useAudioEngine();

  const router = useRouter();
  const { playNext, playPrevious } = useGlobalPlayback();
  const { isGuest, controlTogglePlay, controlSeekTo } = useRoomState();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLandScapeMode, setIsLandScapeMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<"cover" | "lyrics" | "queue">(
    "cover",
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { upNextTracks, isFetching } = useNextInQueue(4);
  const progressPercent = durationSec
    ? (currentTimeSec / durationSec) * 100
    : 0;

  const rgb = useDominantColor(activeMetadata?.coverUrl);
  const primaryGlow = rgb
    ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.55)`
    : "transparent";
  const softGlow = rgb
    ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.25)`
    : "transparent";

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const MIN_SWIPE_DISTANCE = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const navigateToArtist = (artist?: string) => {
    if (!artist) return;
    router.push(`/dashboard/artist/${encodeURIComponent(artist)}`);

    setIsExpanded(false);
  };

  const handleTouchEndCollapsed = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX > MIN_SWIPE_DISTANCE) playNext?.();
      else if (distanceX < -MIN_SWIPE_DISTANCE) playPrevious?.();
    } else if (distanceY > MIN_SWIPE_DISTANCE && activeMetadata) {
      setIsExpanded(true);
    }
  };

  const handleTouchEndExpanded = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (distanceX > MIN_SWIPE_DISTANCE) playNext?.();
      else if (distanceX < -MIN_SWIPE_DISTANCE) playPrevious?.();
    } else if (distanceY < -MIN_SWIPE_DISTANCE) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <>
        <div className="block md:hidden fixed bottom-0 left-0 right-0 h-[220px] pointer-events-none z-[40]">
          <div className="absolute bottom-0 left-0 right-0 h-full backdrop-blur-md backdrop-saturate-200 [-webkit-mask-image:linear-gradient(to_top,black_65%,transparent_100%)] [mask-image:linear-gradient(to_top,black_65%,transparent_100%)] pointer-events-none -z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-[220px] bg-gradient-to-t from-background/95 via-background/70 to-transparent pointer-events-none -z-10" />
        </div>

        <div
          className="fixed bottom-[80px] left-3 right-3 z-[999] cursor-pointer touch-pan-y"
          onClick={() => activeMetadata && setIsExpanded(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEndCollapsed}
        >
          <div
            className="absolute top-0 -bottom-15 -left-4 -right-4 -z-10 blur-2xl rounded-full pointer-events-none transition-colors duration-700 ease-out"
            style={{ backgroundColor: primaryGlow }}
          />

          <LiquidContainer
            radius="16px"
            className="w-full h-[56px] relative z-10"
          >
            <div
              className="h-full bg-foreground/5 absolute inset-0 rounded-[16px] transition-all duration-75"
              style={
                activeMetadata
                  ? {
                    width: progressPercent > 7 ? `${progressPercent}%` : "6%",
                  }
                  : { width: 0 }
              }
            />

            <div className="w-full h-full flex items-center px-3 z-11 gap-3">
              {activeMetadata ? (
                <>
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 shadow-sm">
                    <Image width={500} height={500} unoptimized
                      src={activeMetadata.coverUrl || ""}
                      className="w-full h-full object-cover"
                      alt="Cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {activeMetadata.title}
                    </h4>
                    <p className="text-[10px] font-medium text-foreground/50 truncate">
                      {activeMetadata.artist}
                    </p>
                  </div>


                  {isGuest ? (
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      <Radio
                        size={18}
                        className="text-emerald-500 animate-pulse"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlTogglePlay();
                      }}
                      className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-foreground/5 active:scale-90 rounded-full transition-all shrink-0"
                    >
                      {isLoading ? (
                        <Loader2
                          size={20}
                          className="animate-spin"
                          strokeWidth={2.5}
                        />
                      ) : isPlaying ? (
                        <Pause size={20} fill="currentColor" strokeWidth={1} />
                      ) : (
                        <Play size={20} fill="currentColor" strokeWidth={1} />
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-3 text-foreground/50 w-full">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <Music size={18} strokeWidth={2} />
                  </div>
                  <h4 className="text-xs font-medium">Ready to play</h4>
                </div>
              )}
            </div>
          </LiquidContainer>
        </div>
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndExpanded}
    >
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140vw] h-[65vh] rounded-full blur-[100px] transition-colors duration-700 ease-out"
          style={{ backgroundColor: primaryGlow }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[120vw] h-[50vh] rounded-full blur-[120px] transition-colors duration-700 ease-out"
          style={{ backgroundColor: softGlow }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>

      <div className="flex items-center justify-between p-6 relative z-10 shrink-0">
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 text-foreground/60 hover:text-foreground rounded-full transition-colors"
        >
          <ChevronDown size={28} strokeWidth={2} />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
          {mobileTab === "lyrics"
            ? "Lyrics"
            : mobileTab === "queue"
              ? "Queue"
              : "Now Playing"}
        </span>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-2 text-foreground/60 hover:text-foreground rounded-full transition-colors"
        >
          <ChevronDown size={28} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10 px-6">
        {mobileTab === "cover" && (
          <div className="flex-1 flex items-center justify-center px-2">
            <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <Image width={500} height={500} unoptimized
                src={activeMetadata?.coverUrl || ""}
                className="w-full h-full object-cover"
                alt="Cover"
              />
            </div>
          </div>
        )}
        {mobileTab === "lyrics" && (
          <div className="flex-1 overflow-hidden flex flex-col w-full relative">
            {activeMetadata && (
              <SyncedLyrics
                activeMetadata={activeMetadata}
                currentTimeSec={currentTimeSec}
                seekToTime={controlSeekTo}
              />
            )}
          </div>
        )}
        {mobileTab === "queue" && (
          <div className="flex-1 flex flex-col max-w-xl w-full h-full overflow-hidden">
            <PlaybackStatus isFetching={isFetching} />
            <h3 className="text-[12px] font-medium text-foreground/50 tracking-wide mb-2 mt-5 shrink-0 px-1">
              Playing Next
            </h3>
            <div className="flex-1 liquid-scroll px-1 space-y-0.5">
              {upNextTracks.map((track, idx) => (
                <Track
                  key={track.id || track._id || `queue-${idx}`}
                  track={track}
                  variant="row"
                  loadingId={loadingId}
                  setLoadingId={setLoadingId}
                  showDuration={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-12 pt-6 relative z-10 shrink-0 flex flex-col">
        <div onClick={() => navigateToArtist(activeMetadata?.artist)} className="flex cursor-pointer flex-col items-center justify-center mb-6 w-full px-4 text-center">
          <h2 className="text-xl font-bold text-foreground truncate w-full tracking-tight mb-0.5">
            {activeMetadata?.title}
          </h2>
          <p className="text-sm font-medium text-foreground/50 truncate w-full">
            {activeMetadata?.artist}
          </p>
        </div>

        <div className="flex items-center justify-between w-full mb-6 px-2">
          <Button
            size="mobileIcon"
            onClick={() =>
              setMobileTab((prev) => (prev === "lyrics" ? "cover" : "lyrics"))
            }
            className={cn(
              "flex items-center justify-center transition-colors",
              mobileTab === "lyrics" ? "text-primary" : "text-foreground/70 hover:text-foreground",
            )}
          >
            <Mic2 size={32} strokeWidth={2} />
          </Button>

          <LiquidContainer radius="999px">
            <div className="flex items-center h-10 px-1.5 gap-1">
              <div className="w-8 h-8 flex items-center justify-center">
                <StarButton className="p-0" />
              </div>
              <button
                onClick={() => setIsPlaylistModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
              >
                <ListPlus size={18} strokeWidth={2.5} />
              </button>
              <TrackDropdownMenu
                track={activeMetadata}
                size="lg"
                side="top"
                align="center"
                onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
                trigger={
                  <button className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors">
                    <EllipsisVertical size={18} strokeWidth={2.5} />
                  </button>
                }
              />
            </div>
          </LiquidContainer>

          <LiquidContainer radius="999px">
            <button
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors",
                mobileTab === "queue"
                  ? "text-primary"
                  : "text-foreground/70 hover:text-foreground",
              )}
              onClick={() =>
                setMobileTab((prev) => (prev === "queue" ? "cover" : "queue"))
              }
            >
              <ListMusic size={18} strokeWidth={2} />
            </button>
          </LiquidContainer>
        </div>

        <Timeline className="mb-8" />

        <div className="flex items-center justify-between px-3 w-full">
          <button
            disabled={!activeMetadata}
            className="text-foreground/40 hover:text-foreground active:scale-95 transition-all disabled:opacity-40"
          >
            <Shuffle size={22} strokeWidth={2} />
          </button>

          <button
            onClick={playPrevious}
            disabled={!queue || (queueIndex <= 0 && currentTimeSec <= 3)}
            className="text-foreground/70 hover:text-foreground active:scale-95 transition-all disabled:opacity-30"
          >
            <SkipBack size={32} strokeWidth={1.5} />
          </button>

          <button
            onClick={controlTogglePlay}
            disabled={!activeMetadata}
            className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center active:scale-90 transition-transform shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2
                size={30}
                className="animate-spin text-background"
                strokeWidth={2.5}
              />
            ) : isPlaying ? (
              <Pause size={30} fill="currentColor" strokeWidth={1} />
            ) : (
              <Play
                size={30}
                fill="currentColor"
                className="ml-1"
                strokeWidth={1}
              />
            )}
          </button>

          <button
            onClick={() => playNext(false)}
            disabled={!activeMetadata}
            className="text-foreground/70 hover:text-foreground active:scale-95 transition-all disabled:opacity-30"
          >
            <SkipForward size={32} strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setIsOnLoop(!isOnLoop)}
            disabled={!activeMetadata}
            className={cn(
              "transition-colors disabled:opacity-40 active:scale-95",
              isOnLoop
                ? "text-emerald-500"
                : "text-foreground/40 hover:text-foreground",
            )}
          >
            <Repeat size={22} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
