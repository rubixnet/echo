"use client";

import Image from "next/image";
import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrackActionMenuContent,
} from "@/components/GlobalPlayer/TrackActionsMenu";
import {
  Play,
  EllipsisVertical,
  Pause,
  Loader,
} from "lucide-react";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useUserExclusions } from "@/hooks/useUserExclusions";
import { cn } from "@/lib/utils";
import { OfficialBadge } from "@/components/OfficialBadge";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import {
  normalizeTrack,
  type CanonicalTrack,
  type NormalizableTrack,
} from "@/lib/trackUtils";

interface TrackProps {
  track: NormalizableTrack | null;
  index?: number;
  variant: "grid" | "row";
  loadingId: string | null;
  setLoadingId: (id: string | null) => void;
  onOpenPlaylistModal?: (track: CanonicalTrack) => void;
  playlistId?: string;
  showDuration?: boolean;
  className?: string;
}

export function Track({
  track,
  index = 0,
  variant,
  loadingId,
  setLoadingId,
  onOpenPlaylistModal,
  playlistId,
  showDuration = true,
  className,
}: TrackProps) {
  const { playTrack } = useGlobalPlayback();
  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const { isHardBanned } = useUserExclusions();

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  const normalized = normalizeTrack(track);

  if (!track || !normalized.id || isHardBanned(normalized.id)) {
    return null;
  }

  const isLoading = loadingId === normalized.id;
  const isCurrent = currentTrackUrl?.includes(normalized.id) && isPlaying;

  const handlePlay = () => playTrack(normalized, setLoadingId);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePlay();
    }
  };

  const handleModalOpen = (trackToOpen: CanonicalTrack) => {
    setIsDropdownOpen(false);
    setIsContextMenuOpen(false);
    if (onOpenPlaylistModal) onOpenPlaylistModal(trackToOpen);
    else setIsPlaylistModalOpen(true);
  };

  return (
    <>
      <ContextMenu open={isContextMenuOpen} onOpenChange={setIsContextMenuOpen}>
        <ContextMenuTrigger asChild>
          {variant === "grid" ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handlePlay}
              onKeyDown={handleKeyDown}
              className={cn(
                "group relative flex flex-col gap-2 w-full max-w-[240px] mx-auto rounded-2xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                className
              )}
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shadow-sm shrink-0">
                <Image
                  width={400}
                  height={400}
                  unoptimized
                  src={normalized.coverUrl}
                  alt={normalized.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
                  }}
                />

                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/20 transition-all duration-300",
                    isCurrent
                      ? "bg-black/50 opacity-100"
                      : "opacity-0 group-hover:bg-black/30 group-hover:opacity-100"
                  )}
                >
                  <div
                    className={cn(
                      "text-white transform transition-transform duration-300 drop-shadow-md z-10",
                      isCurrent || isLoading
                        ? "scale-100"
                        : "scale-75 group-hover:scale-100"
                    )}
                  >
                    {isLoading ? (
                      <Loader size={32} className="animate-spin text-white" />
                    ) : isCurrent ? (
                      <Pause size={32} className="fill-white text-white" />
                    ) : (
                      <Play size={32} className="fill-white text-white ml-1" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 px-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <h3
                    className={cn(
                      "font-semibold text-base leading-tight truncate tracking-tight flex-1",
                      isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-neutral-100"
                    )}
                    title={normalized.title}
                  >
                    {normalized.title}
                  </h3>
                  <DropdownMenu
                    open={isDropdownOpen}
                    onOpenChange={setIsDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 -mr-1 -mt-0.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer transition-colors focus-visible:outline-none rounded-md shrink-0"
                      >
                        <EllipsisVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[215px] z-[9999]"
                    >
                      <TrackActionMenuContent
                        track={normalized}
                        size="md"
                        playlistId={playlistId}
                        onOpenPlaylistModal={handleModalOpen}
                        onClose={() => setIsDropdownOpen(false)}
                        ItemComponent={DropdownMenuItem}
                        SeparatorComponent={DropdownMenuSeparator}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-sm font-medium text-neutral-500 truncate flex items-center gap-1 min-w-0">
                  <Link
                    href={`/dashboard/artist/${encodeURIComponent(normalized.artist)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors truncate font-medium leading-tight"
                    title={normalized.artist}
                  >
                    {normalized.artist}
                  </Link>
                  <OfficialBadge isOfficial={!!track.isOfficial} />
                </div>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={handlePlay}
              onKeyDown={handleKeyDown}
              className={cn(
                `flex items-center justify-between py-2.5 group cursor-pointer hover:bg-neutral-100/60 dark:hover:bg-white/5 px-2 -mx-2 rounded-xl border-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`,
                className
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {index > 0 && (
                  <span className="w-4 text-xs font-mono hidden md:block font-bold text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 shrink-0 text-center">
                    {index.toString().padStart(2, "0")}
                  </span>
                )}
                <div className="relative w-11 h-11 overflow-hidden shrink-0 rounded-lg border border-neutral-200/60 dark:border-white/10 shadow-sm bg-black/5 p-0.5">
                  <Image
                    width={500}
                    height={500}
                    unoptimized
                    src={normalized.coverUrl}
                    className="w-full h-full object-cover select-none rounded-md"
                    alt={normalized.title}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
                    }}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-md",
                      isCurrent
                        ? "bg-black/30 opacity-100"
                        : "bg-neutral-950/20 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    {isLoading ? (
                      <Loader size={14} className="text-white animate-spin" />
                    ) : isCurrent ? (
                      <Pause size={14} className="text-white fill-white" />
                    ) : (
                      <Play size={14} className="text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <p
                    className={cn(
                      "text-sm font-bold truncate tracking-tight leading-snug",
                      isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-neutral-100"
                    )}
                  >
                    {normalized.title}
                  </p>
                  <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">
                    <Link
                      href={`/dashboard/artist/${encodeURIComponent(normalized.artist)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors z-10 relative"
                    >
                      {normalized.artist}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showDuration && (
                  <div className="text-xs font-mono font-medium text-neutral-400 shrink-0 pr-1 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                    {normalized.duration}
                  </div>
                )}

                <DropdownMenu
                  open={isDropdownOpen}
                  onOpenChange={setIsDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 cursor-pointer transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                    >
                      <EllipsisVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-[215px] z-[9999]"
                  >
                    <TrackActionMenuContent
                      track={normalized}
                      size="md"
                      playlistId={playlistId}
                      onOpenPlaylistModal={handleModalOpen}
                      onClose={() => setIsDropdownOpen(false)}
                      ItemComponent={DropdownMenuItem}
                      SeparatorComponent={DropdownMenuSeparator}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </ContextMenuTrigger>

        <ContextMenuContent className="w-[215px] z-[9999]">
          <TrackActionMenuContent
            track={normalized}
            size="md"
            playlistId={playlistId}
            onOpenPlaylistModal={handleModalOpen}
            onClose={() => setIsContextMenuOpen(false)}
            ItemComponent={ContextMenuItem}
            SeparatorComponent={ContextMenuSeparator}
          />
        </ContextMenuContent>
      </ContextMenu>

      {isPlaylistModalOpen && (
        <AddToPlaylistModal
          track={normalized}
          trackId={normalized.id}
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
        />
      )}
    </>
  );
}