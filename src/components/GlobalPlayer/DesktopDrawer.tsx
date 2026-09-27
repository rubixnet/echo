"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import { SyncedLyrics } from "@/components/SyncedLyrics";
import {
  Timeline,
  PlaybackControls,
  StarButton,
  useNextInQueue,
  VibrantBackground,
  PlaybackStatus,
} from "./Shared";
import { Track } from "../TrackComponent";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Maximize2,
  Minimize2,
  Music,
  EllipsisVertical,
  ListFilter,
  Lyrics,
} from "@/components/icons";
import { Loader2, ImageIcon } from "lucide-react";
import { TrackDropdownMenu } from "./TrackActionsMenu";
import Image from "next/image";

export type TabView = "cover" | "lyrics" | "queue";

const tabIcons = {
  cover: ImageIcon,
  lyrics: Lyrics,
  queue: ListFilter,
};

export function DesktopDrawer({
  isOpen,
  setIsOpen,
  setIsPlaylistModalOpen,
  activeTab,
  setActiveTab,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  setIsPlaylistModalOpen: (v: boolean) => void;
  activeTab: TabView;
  setActiveTab: (tab: TabView) => void;
}) {
  const { activeMetadata, isPlaying, currentTimeSec, durationSec, seekToTime } =
    useAudioEngine();
  const router = useRouter();
  const { upNextTracks, isFetching } = useNextInQueue(5);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const queueContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFullscreen && activeTab === "cover") {
      setActiveTab("lyrics");
    }
  }, [isFullscreen, activeTab, setActiveTab]);

  useEffect(() => {
    if (lyricsContainerRef.current) {
      lyricsContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (queueContainerRef.current) {
      queueContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeMetadata?.id, activeMetadata?.title, activeMetadata?.artist]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < window.innerWidth - 100) {
        setDrawerWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const navigateToArtist = (artist?: string) => {
    if (!artist) return;
    router.push(`/dashboard/artist/${encodeURIComponent(artist)}`);
    setIsOpen(false);
  };

  return (
    <div
      style={{ width: isFullscreen ? "100vw" : `${drawerWidth}px` }}
      className={cn(
        "fixed top-0 right-0 h-full bg-background z-[1000] flex flex-col font-sans antialiased overflow-hidden shadow-2xl border-l border-foreground/5",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        isOpen ? "translate-x-0" : "translate-x-full",
        !isResizing &&
          "transition-[width,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
    >
      <VibrantBackground imageUrl={activeMetadata?.coverUrl} opacity={0.15} />

      {!isFullscreen && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-foreground/10 active:bg-foreground/20 z-[1001] transition-colors"
        />
      )}

      <div className="flex items-center justify-between p-3.5 shrink-0 relative z-10">
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="p-1.5 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ChevronDown size={16} className="rotate-90" strokeWidth={2.5} />
          </button>
        </div>

        {!isFullscreen && (
          <ButtonGroup separator={false}>
            {(["lyrics", "cover", "queue"] as TabView[]).map((tab) => {
              const Icon = tabIcons[tab];
              const isActive = activeTab === tab;

              return (
                <Button
                  key={tab}
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  title={tab}
                  className={cn(
                    "w-10 transition-colors",
                    isActive
                      ? "bg-foreground/5 text-primary hover:bg-primary/15 hover:text-primary"
                      : "text-foreground/50 hover:text-foreground hover:bg-foreground/10",
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                </Button>
              );
            })}
          </ButtonGroup>
        )}

        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-1.5 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 size={15} strokeWidth={2.5} />
            ) : (
              <Maximize2 size={15} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      {isFullscreen ? (
        <div className="flex-1 min-h-0 relative z-10 flex items-center justify-center px-8 lg:px-16 w-full max-w-7xl mx-auto overflow-hidden">
          {activeMetadata ? (
            <div className="flex flex-row items-stretch justify-center gap-10 lg:gap-14 w-full h-full max-h-[600px] overflow-hidden py-4">
              
              <div className="w-[320px] lg:w-[360px] shrink-0 flex flex-col justify-start h-full">
                <div className="w-full aspect-square rounded-2xl shadow-2xl overflow-hidden border border-foreground/10 mb-6 bg-foreground/5 shrink-0">
                  <Image
                    width={500}
                    height={500}
                    unoptimized
                    src={activeMetadata.coverUrl || ""}
                    className="w-full h-full object-cover select-none"
                    alt={activeMetadata.title || "Cover"}
                  />
                </div>

                <div className="w-full flex items-center justify-between mb-8 px-0.5 shrink-0">
                  <div
                    onClick={() => navigateToArtist(activeMetadata.artist)}
                    className="flex cursor-pointer flex-col min-w-0 pr-4"
                  >
                    <h2 className="text-lg lg:text-xl font-semibold text-foreground truncate tracking-tight">
                      {activeMetadata.title}
                    </h2>
                    <p className="text-sm font-medium text-foreground/60 truncate mt-1 hover:underline">
                      {activeMetadata.artist}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-foreground/60">
                    <div className="scale-75 origin-center">
                      <StarButton className="p-1" />
                    </div>
                    <TrackDropdownMenu
                      track={activeMetadata}
                      size="md"
                      side="top"
                      align="end"
                      onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
                      trigger={
                        <button className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-colors">
                          <EllipsisVertical size={18} strokeWidth={2.2} />
                        </button>
                      }
                    />
                  </div>
                </div>

                <div className="w-full shrink-0">
                  <Timeline className="w-full mb-4" />
                  <PlaybackControls
                    iconSize={22}
                    className={cn(
                      "w-full justify-between px-1",
                      "[&_button]:!bg-transparent [&_button]:!shadow-none [&_button]:!border-none [&_button]:!text-foreground",
                      "[&_.rounded-full]:!bg-transparent [&_.rounded-full]:!shadow-none [&_.rounded-full]:!border-none [&_.rounded-full]:!text-foreground",
                      "hover:[&_button]:!bg-transparent hover:[&_.rounded-full]:!bg-transparent hover:[&_button]:opacity-70 transition-opacity",
                    )}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0 max-w-2xl lg:max-w-3xl h-full flex flex-col overflow-hidden">
                <div className="flex items-center justify-center mt-1 mb-6 shrink-0 h-9">
                  <ButtonGroup separator={false}>
                    {(["lyrics", "queue"] as TabView[]).map((tab) => {
                      const Icon = tabIcons[tab];
                      const isActive = activeTab === tab;

                      return (
                        <Button
                          key={tab}
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab(tab)}
                          title={tab}
                          className={cn(
                            "w-10 transition-colors",
                            isActive
                              ? "bg-foreground/5 text-primary hover:bg-primary/15 hover:text-primary"
                              : "text-foreground/50 hover:text-foreground hover:bg-foreground/10",
                          )}
                        >
                          <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                        </Button>
                      );
                    })}
                  </ButtonGroup>
                </div>

                {activeTab === "lyrics" ? (
                  <div
                    ref={lyricsContainerRef}
                    className="relative flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_85%,transparent_100%)] flex flex-col py-6"
                  >
                    <SyncedLyrics
                      key={activeMetadata.title || "fullscreen-lyrics"}
                      activeMetadata={activeMetadata}
                      currentTimeSec={currentTimeSec}
                      seekToTime={seekToTime}
                      isPlaying={isPlaying}
                      durationSec={durationSec}
                    />
                  </div>
                ) : (
                  <div className="relative flex-1 min-h-0 flex flex-col w-full overflow-hidden">
                    <PlaybackStatus isFetching={isFetching} />
                    <h3 className="text-xs font-semibold text-foreground/50 tracking-wider uppercase mb-3 mt-2 shrink-0 px-1">
                      Playing Next
                    </h3>

                    <div 
                      ref={queueContainerRef}
                      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] px-1 space-y-1 pb-10 w-full"
                    >
                      {upNextTracks.map((track, idx) => (
                        <div key={track.id || track._id || `queue-${idx}`} className="w-full">
                          <Track
                            track={track}
                            variant="row"
                            loadingId={loadingId}
                            setLoadingId={setLoadingId}
                            showDuration={false}
                            className="hover:bg-foreground/5 rounded-lg py-1.5 w-full font-normal"
                          />
                        </div>
                      ))}

                      {isFetching && (
                        <div className="flex items-center justify-center p-6 text-foreground/40 gap-2">
                          <Loader2 className="animate-spin" size={14} />
                          <span className="text-xs font-medium">Finding similar tracks...</span>
                        </div>
                      )}

                      {!isFetching && upNextTracks.length === 0 && (
                        <div className="flex items-center justify-center p-6 text-foreground/40">
                          <span className="text-xs font-medium">End of queue</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-foreground/30 gap-3">
              <Music size={28} />
              <p className="text-xs font-medium uppercase tracking-widest">No active track</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 relative z-10 overflow-hidden flex flex-col px-4 min-h-0">
            {activeMetadata ? (
              <>
                {activeTab === "lyrics" && (
                  <div
                    ref={lyricsContainerRef}
                    className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col max-w-xl mx-auto relative [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] py-4"
                  >
                    <SyncedLyrics
                      key={activeMetadata.title || "drawer-lyrics"}
                      activeMetadata={activeMetadata}
                      currentTimeSec={currentTimeSec}
                      seekToTime={seekToTime}
                      isPlaying={isPlaying}
                      durationSec={durationSec}
                    />
                  </div>
                )}

                {activeTab === "cover" && (
                  <div className="flex-1 flex items-center justify-center p-2">
                    <div className="w-full max-w-[240px] aspect-square rounded-xl shadow-xl overflow-hidden shrink-0 border border-foreground/5 bg-foreground/5">
                      <Image
                        width={500}
                        height={500}
                        unoptimized
                        src={activeMetadata.coverUrl || ""}
                        className="w-full h-full object-cover select-none"
                        alt={activeMetadata.title || "Cover"}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "queue" && (
                  <div className="flex-1 min-h-0 flex flex-col max-w-xl w-full h-full overflow-hidden relative">
                    <PlaybackStatus isFetching={isFetching} />
                    <h3 className="text-xs font-semibold text-foreground/50 tracking-wider uppercase mb-2 mt-4 shrink-0 px-1">
                      Playing Next
                    </h3>
                    
                    <div 
                      ref={queueContainerRef}
                      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] px-1 space-y-0.5 pb-6"
                    >
                      {upNextTracks.map((track, idx) => (
                        <div key={track.id || track._id || `queue-${idx}`} className="w-full">
                          <Track
                            track={track}
                            variant="row"
                            loadingId={loadingId}
                            setLoadingId={setLoadingId}
                            showDuration={false}
                            className="hover:bg-foreground/5 w-full font-normal"
                          />
                        </div>
                      ))}

                      {isFetching && (
                        <div className="flex items-center justify-center p-6 text-foreground/40 gap-2">
                          <Loader2 className="animate-spin" size={14} />
                          <span className="text-xs font-medium">Finding similar tracks...</span>
                        </div>
                      )}

                      {!isFetching && upNextTracks.length === 0 && (
                        <div className="flex items-center justify-center p-6 text-foreground/40">
                          <span className="text-xs font-medium">End of queue</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-foreground/30 gap-3">
                <Music size={24} />
                <p className="text-xs font-medium uppercase tracking-widest">No active track</p>
              </div>
            )}
          </div>

          {activeMetadata && (
            <div className="px-5 pb-5 pt-3 shrink-0 relative z-10 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div
                  onClick={() => navigateToArtist(activeMetadata.artist)}
                  className="flex cursor-pointer flex-col min-w-0 pr-4"
                >
                  <h2 className="text-sm font-semibold text-foreground truncate tracking-tight mb-0.5">
                    {activeMetadata.title}
                  </h2>
                  <p className="text-xs font-medium text-foreground/60 truncate hover:underline">
                    {activeMetadata.artist}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 text-foreground/60">
                  <div className="scale-75 origin-center">
                    <StarButton className="p-1" />
                  </div>
                  <TrackDropdownMenu
                    track={activeMetadata}
                    size="md"
                    side="top"
                    align="center"
                    onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
                    trigger={
                      <button className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors">
                        <EllipsisVertical size={18} strokeWidth={2.2} />
                      </button>
                    }
                  />
                </div>
              </div>

              <Timeline className="mb-4" />
              <PlaybackControls
                iconSize={20}
                className={cn(
                  "justify-between px-1",
                  "[&_button]:!bg-transparent [&_button]:!shadow-none [&_button]:!border-none [&_button]:!text-foreground",
                  "[&_.rounded-full]:!bg-transparent [&_.rounded-full]:!shadow-none [&_.rounded-full]:!border-none [&_.rounded-full]:!text-foreground",
                  "hover:[&_button]:!bg-transparent hover:[&_.rounded-full]:!bg-transparent hover:[&_button]:opacity-70 transition-opacity",
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}