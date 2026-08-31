"use client";

import { useState, useEffect } from "react";
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
  ListMusic,
} from "@/components/icons";
import {
  Loader2,
  ImageIcon,
  Mic2,
} from "lucide-react";
import { TrackDropdownMenu } from "./TrackActionsMenu";
import Image from "next/image";

type TabView = "cover" | "lyrics" | "queue";

const tabIcons = {
  cover: ImageIcon,
  lyrics: Mic2,
  queue: ListMusic,
};

export function DesktopDrawer({
  isOpen,
  setIsOpen,
  setIsPlaylistModalOpen,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  setIsPlaylistModalOpen: (v: boolean) => void;
}) {
  const { activeMetadata, currentTimeSec, seekToTime } = useAudioEngine();
  const router = useRouter();
  const { upNextTracks, isFetching } = useNextInQueue(5);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>("cover");
  const [drawerWidth, setDrawerWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 280 && newWidth < window.innerWidth - 100)
        setDrawerWidth(newWidth);
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

    setIsOpen(false)
  };

  return (
    <div
      style={{ width: isFullscreen ? "100vw" : `${drawerWidth}px` }}
      className={cn(
        "fixed top-0 right-0 h-full bg-background z-[1000] flex flex-col overflow-hidden shadow-2xl border-l border-foreground/5",
        isOpen ? "translate-x-0" : "translate-x-full",
        !isResizing &&
        "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
      )}
    >
      <VibrantBackground imageUrl={activeMetadata?.coverUrl} opacity={0.15} />

      {!isFullscreen && (
        <div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-foreground/10 active:bg-foreground/20 z-[1001] transition-colors"
        />
      )}

      <div className="flex items-center justify-between p-3 shrink-0 relative z-10">
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ChevronDown size={16} className="rotate-90" strokeWidth={2.5} />
          </button>
        </div>

        <ButtonGroup separator={false} className="p-0.5">
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

        <div className="flex-1 flex justify-end">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 size={14} strokeWidth={2.5} />
            ) : (
              <Maximize2 size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 relative z-10 overflow-hidden flex flex-col px-4">
        {activeMetadata ? (
          <>
            {activeTab === "lyrics" && (
              <div className="flex-1 overflow-hidden flex flex-col max-w-xl mx-auto w-full relative">
                <SyncedLyrics
                  activeMetadata={activeMetadata}
                  currentTimeSec={currentTimeSec}
                  seekToTime={seekToTime}
                />
              </div>
            )}
            {activeTab === "cover" && (
              <div className="flex-1 flex items-center justify-center p-2">
                <div className="w-full max-w-[220px] aspect-square rounded-xl shadow-xl overflow-hidden shrink-0 border border-foreground/5">
                  <Image
                    width={500}
                    height={500}
                    unoptimized
                    src={activeMetadata.coverUrl || ""}
                    className="w-full h-full object-cover"
                    alt="Cover"
                  />
                </div>
              </div>
            )}
            {activeTab === "queue" && (
              <div className="flex-1 flex flex-col max-w-xl  w-full h-full overflow-hidden">
                <PlaybackStatus isFetching={isFetching} />
                <h3 className="text-[12px] font-medium text-foreground/50 tracking-wide mb-2 mt-5 shrink-0 px-1 ">
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
                      className="hover:bg-foreground/5"
                    />
                  ))}

                  {isFetching && (
                    <div className="flex items-center justify-center p-6 text-foreground/40 gap-2">
                      <Loader2 className="animate-spin" size={14} />
                      <span className="text-xs font-medium">
                        Finding similar tracks...
                      </span>
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
            <p className="text-xs font-medium uppercase tracking-widest">
              No active track
            </p>
          </div>
        )}
      </div>

      {activeMetadata && (
        <div
          className={cn(
            "px-5 pb-5 pt-2 shrink-0 relative z-10 flex flex-col",
            isFullscreen ? "max-w-2xl w-full mx-auto" : "",
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div onClick={() => navigateToArtist(activeMetadata.artist)} className="flex cursor-pointer flex-col min-w-0 pr-4">
              <h2 className="text-sm font-bold text-foreground truncate tracking-tight mb-0.5">
                {activeMetadata.title}
              </h2>
              <p className="text-[10px] font-medium text-foreground/50 truncate">
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
                  <button className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors">
                    <EllipsisVertical size={18} strokeWidth={2.5} />
                  </button>
                }
              />
            </div>
          </div>

          <Timeline className="mb-3" />
          <PlaybackControls iconSize={20} className="justify-between px-1" />
        </div>
      )}
    </div>
  );
}
