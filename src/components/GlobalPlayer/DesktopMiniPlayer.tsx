"use client";

import Image from "next/image";
import { useAudioEngine } from "@/components/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useRoomState } from "@/hooks/useRoomContext";
import { cn } from "@/lib/utils";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { ProgressBar } from "./Shared";
import { TrackDropdownMenu } from "./TrackActionsMenu";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Loader2,
  Music,
  EllipsisVertical,
  Shuffle,
  Radio,
} from "lucide-react";

interface DesktopMiniPlayerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (v: boolean) => void;
  setIsPlaylistModalOpen: (v: boolean) => void;
}

export function DesktopMiniPlayer({
  isDrawerOpen,
  setIsDrawerOpen,
  setIsPlaylistModalOpen,
}: DesktopMiniPlayerProps) {
  const {
    isPlaying,
    isLoading,
    activeMetadata,
    currentTimeSec,
    isOnLoop,
    setIsOnLoop,
    queue,
    queueIndex,
  } = useAudioEngine();

  const { playNext, playPrevious } = useGlobalPlayback();
  const { isGuest, controlTogglePlay, openLockdown } = useRoomState();

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 h-48 md:h-24 pointer-events-none z-[997] transition-opacity duration-300",
          isDrawerOpen ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="absolute bottom-0 left-0 right-0 h-48 md:h-24 backdrop-blur-sm backdrop-saturate-200 [-webkit-mask-image:linear-gradient(to_top,black_60%,transparent_100%)] [mask-image:linear-gradient(to_top,black_60%,transparent_100%)] pointer-events-none -z-20" />
        <div className="absolute bottom-0 left-0 right-0 h-48 md:h-24 bg-gradient-to-t from-background/80 via-background/40 to-transparent pointer-events-none -z-10" />
      </div>

      <div
        className={cn(
          "fixed bottom-3 px-1 left-1/2 -translate-x-1/2 w-[98%] max-w-[1000px] z-[999] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isDrawerOpen ? "translate-y-[150%]" : "translate-y-0",
        )}
      >
        <LiquidContainer radius="16px" className="w-full h-[50px]">
          <div className="w-full h-full flex items-center px-4">
            <div className="flex-[1.5] basis-0 flex items-center gap-3 min-w-0 pr-6">
              {activeMetadata ? (
                <>
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="relative group/cover w-8 h-8 rounded-md overflow-hidden shrink-0 shadow-sm"
                  >
                    <Image
                      width={500}
                      height={500}
                      unoptimized
                      src={activeMetadata.coverUrl || ""}
                      className="w-full h-full object-cover transition-transform"
                      alt="Cover"
                    />
                  </button>

                  <div className="flex flex-col flex-1 min-w-0 justify-center gap-[2px]">
                    <div className="flex items-baseline truncate">
                      <h4
                        className="text-[11px] font-bold uppercase tracking-wide text-foreground truncate cursor-pointer hover:underline"
                        onClick={() => setIsDrawerOpen(true)}
                      >
                        {activeMetadata.title}
                      </h4>
                      <span className="text-[10px] font-medium text-foreground/50 ml-2 truncate shrink-0">
                        • {activeMetadata.artist}
                      </span>
                    </div>

                    <ProgressBar
                      heightClass="h-1"
                      hoverHeightClass="group-hover/timeline:h-1.5"
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4 text-foreground/50">
                  <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center shrink-0">
                    <Music size={16} />
                  </div>
                  <h4 className="text-xs font-medium">Ready to play</h4>
                </div>
              )}
            </div>

            <div className="flex-[1] basis-0 flex items-center justify-center gap-4">
              {isGuest ? (
                <button
                  onClick={openLockdown}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors rounded-full border border-emerald-500/20 shadow-sm cursor-pointer"
                >
                  <Radio size={14} className="animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Live • Leave Room
                  </span>
                </button>
              ) : (
                <>
                  <button
                    disabled={!activeMetadata}
                    className="text-foreground/40 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Shuffle size={20} strokeWidth={2} />
                  </button>
                  <button
                    onClick={playPrevious}
                    disabled={
                      !queue || (queueIndex <= 0 && currentTimeSec <= 3)
                    }
                    className="text-foreground/70 hover:text-foreground active:scale-95 transition-all disabled:opacity-30"
                  >
                    <SkipBack size={24} strokeWidth={1} />
                  </button>
                  <button
                    onClick={controlTogglePlay}
                    disabled={!activeMetadata}
                    className="text-foreground hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2
                        size={28}
                        className="animate-spin"
                        strokeWidth={2.5}
                      />
                    ) : isPlaying ? (
                      <Pause size={28} fill="currentColor" strokeWidth={1} />
                    ) : (
                      <Play size={28} fill="currentColor" strokeWidth={1} />
                    )}
                  </button>
                  <button
                    onClick={() => playNext(false)}
                    disabled={!activeMetadata}
                    className="text-foreground/70 hover:text-foreground active:scale-95 transition-all disabled:opacity-30"
                  >
                    <SkipForward size={24} strokeWidth={1} />
                  </button>
                  <button
                    onClick={() => setIsOnLoop(!isOnLoop)}
                    disabled={!activeMetadata}
                    className={cn(
                      "transition-colors shrink-0",
                      isOnLoop
                        ? "text-emerald-500"
                        : "text-foreground/40 hover:text-foreground",
                    )}
                  >
                    <Repeat size={20} strokeWidth={2} />
                  </button>
                </>
              )}
            </div>

            <div className="flex-[1.5] basis-0 flex items-center justify-end gap-3 min-w-0 pl-8">
              {/* <StarButton /> */}
              {/* <button onClick={() => setIsDrawerOpen(true)} disabled={!activeMetadata} className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50 shrink-0"><Mic2 size={20} strokeWidth={2} /></button> */}
              {/* <button disabled={!activeMetadata} className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50 shrink-0"><ListMusic size={20} strokeWidth={2} /></button> */}
              {/* <button disabled={!activeMetadata} className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50 shrink-0"><MonitorSpeaker size={20} strokeWidth={2} /></button> */}
              {/* <div className="flex items-center gap-2 shrink-0 group/volume" onMouseEnter={() => setIsVolumeExpanded(true)} onMouseLeave={() => setIsVolumeExpanded(false)}>
                                <button onClick={() => setVolume && setVolume(volume === 0 ? 0.8 : 0)} className="text-foreground/70 group-hover/volume:text-foreground transition-colors shrink-0">
                                    {volume === 0 ? <VolumeX size={20} strokeWidth={2} /> : <Volume2 size={20} strokeWidth={2} />}
                                </button>
                                <div className={cn("transition-all duration-300 overflow-hidden flex items-center origin-left", isVolumeExpanded ? "w-20 opacity-100" : "w-0 opacity-0")}>
                                    <input type="range" min="0" max="1" step="0.01" value={volume !== undefined ? volume : 0.8} onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-foreground/20 rounded-full appearance-none cursor-pointer accent-foreground" />
                                </div>
                            </div> */}
              <div className="relative shrink-0">
                {activeMetadata ? (
                  <TrackDropdownMenu
                    track={activeMetadata}
                    size="sm"
                    side="top"
                    align="end"
                    onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
                    trigger={
                      <button
                        disabled={!activeMetadata}
                        className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <EllipsisVertical size={20} strokeWidth={2} />
                      </button>
                    }
                  />
                ) : (
                  <div className="w-5" />
                )}
              </div>
            </div>
          </div>
        </LiquidContainer>
      </div>
    </>
  );
}
