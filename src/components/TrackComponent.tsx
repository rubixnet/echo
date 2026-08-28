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
} from "@/components/ui/dropodown-menu";
import {
  Play,
  Check,
  Pause,
  Loader2,
  PlaySquare,
  ListEnd,
  Trash2,
  EllipsisVertical,
  Bookmark,
  Plus,
  Pin,
  Radio,
  Share,
  Star,
  ThumbsDown,
  Ban,
} from "lucide-react";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useUser } from "@/hooks/useUser";
import { useUserExclusions } from "@/hooks/useUserExclusions";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { OfficialBadge } from "@/components/OfficialBadge";
import { AddToPlaylistModal } from "@/components/AddToPlaylistModal";
import {
  normalizeTrack,
  type CanonicalTrack,
  type NormalizableTrack,
} from "@/lib/trackUtils";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const isMobile = React.useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches,
    () => false,
  );

  return isMobile;
}

type MenuItemComponent = React.ComponentType<{
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children?: React.ReactNode;
}>;

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
  onOpenActionMenu?: () => void;
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
  const { playTrack, playNextPriority, addToQueue } = useGlobalPlayback();
  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const user = useUser();
  const isMobile = useIsMobile();
  const { isTrackExcluded } = useUserExclusions();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const removeTrackFromPlaylist = useMutation(api.playlists.removeFromPlaylist);
  const toggleLikeMutation = useMutation(api.likes.toggleLike);
  const toggleSaveLibraryItem = useMutation(api.library.toggleSaveItem);
  const suggestLess = useMutation(api.suggestLess.addToUserSuggestLessTracks);
  const neverShowAgain = useMutation(
    api.neverShowAgain.addToNeverShowAgainTracks,
  );

  const normalized = normalizeTrack(track);

  const isLiked = useQuery(
    api.likes.checkLiked,
    user?._id && normalized?.id
      ? { userId: user._id, trackId: normalized.id }
      : "skip",
  );

  const isBookmarked = useQuery(
    api.library.checkSaved,
    user?._id && normalized?.id
      ? { userId: user._id, itemType: "track", itemId: normalized.id }
      : "skip",
  );

  if (!track || !normalized.id || isDismissed || isTrackExcluded(normalized.id)) {
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

  const handlePlayNext = () => playNextPriority(normalized);
  const handleAddToQueue = () => addToQueue(normalized);

  const handleShare = () => {
    const url = `${window.location.origin}/dashboard/track/${normalized.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const handleLike = async () => {
    if (!user?._id || !normalized.id) return;
    await toggleLikeMutation({
      userId: user._id,
      trackId: normalized.id,
      title: normalized.title,
      artist: normalized.artist,
      coverUrl: normalized.coverUrl,
      duration: normalized.duration,
      audioUrl: normalized.audioUrl,
      source: normalized.source,
    });
  };

  const handleToggleLibrary = async () => {
    if (!user?._id || !normalized.id) return;
    await toggleSaveLibraryItem({
      userId: user._id,
      itemType: "track",
      itemId: normalized.id,
      title: normalized.title,
      subtitle: normalized.artist,
      coverUrl: normalized.coverUrl,
      metadata: {
        duration: normalized.duration,
        audioUrl: normalized.audioUrl,
        source: normalized.source,
      },
    });
  };

  const handleRemoveFromPlaylist = async () => {
    if (!playlistId || !normalized.id) return;
    await removeTrackFromPlaylist({
      playlistId: playlistId as Id<"playlists">,
      trackId: normalized.id,
    });
  };

  const handleOpenPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsContextMenuOpen(false);
    if (onOpenPlaylistModal) onOpenPlaylistModal(normalized);
    else setIsPlaylistModalOpen(true);
  };

  const handleSuggestLess = async () => {
    if (!user?._id || !normalized.id) return;
    setIsDismissed(true);

    try {
      await suggestLess({
        userId: user._id,
        trackId: normalized.id,
        title: normalized.title,
        artist: normalized.artist,
        coverUrl: normalized.coverUrl,
        duration: normalized.duration,
      });
    } catch (error) {
      console.error("Failed to suggest less:", error);
      setIsDismissed(false);
    }
  };

  const handleNeverShowAgain = async () => {
    if (!user?._id || !normalized.id) return;
    setIsDismissed(true);

    try {
      await neverShowAgain({
        userId: user._id,
        trackId: normalized.id,
        title: normalized.title,
        artist: normalized.artist,
        coverUrl: normalized.coverUrl,
        duration: normalized.duration,
      });
    } catch (error) {
      console.error("Failed to never suggest again:", error);
      setIsDismissed(false);
    }
  };

  const itemClassName = cn(
    "cursor-pointer font-medium focus:bg-background focus:text-primary text-primary/90 outline-none border-none",
    isMobile
      ? "gap-3 rounded-lg text-[15px] py-2.5 px-3"
      : "gap-2.5 rounded-md text-[13px] py-1.5 px-2.5",
  );
  const iconSize = isMobile ? 18 : 16;
  const menuContainerClass = cn(
    "border backdrop-blur-lg border-primary/10 p-0 z-[9999] overflow-hidden",
    isMobile ? "w-[260px] rounded-[24px]" : "w-[220px] rounded-2xl",
  );

  const renderMenuItems = (Item: MenuItemComponent, Separator: MenuItemComponent) => (
    <div className="flex flex-col w-full text-primary">
      <div
        className={cn(
          "flex items-center justify-around border-b border-primary/10",
          isMobile ? "px-6 py-4" : "px-4 py-3",
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className={cn(
            "hover:scale-110 active:scale-95 transition-all outline-none",
            isLiked ? "text-emerald-500" : "text-primary",
          )}
          title={isLiked ? "Remove from Favorite" : "Add to Favorite"}
        >
          <Star
            size={isMobile ? 22 : 18}
            className={cn(
              "transition-colors",
              isLiked ? "fill-emerald-500 text-emerald-500" : "text-primary/80",
            )}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleLibrary();
          }}
          className={cn(
            "hover:scale-110 active:scale-95 transition-all outline-none",
            isBookmarked ? "text-primary" : "text-primary",
          )}
          title={isBookmarked ? "Remove from Library" : "Save to Library"}
        >
          <Bookmark
            size={isMobile ? 22 : 18}
            className={cn(
              "transition-colors",
              isBookmarked ? "fill-primary text-primary" : "text-primary/80",
            )}
          />
        </button>
        <button
          onClick={handleOpenPlaylist}
          className="hover:scale-110 active:scale-95 transition-all text-primary outline-none"
          title="Add to Playlist"
        >
          <Plus size={isMobile ? 24 : 20} className="text-primary/80" />
        </button>
      </div>
      <div
        className={cn(
          "flex flex-col",
          isMobile ? "p-2 gap-0.5" : "p-1.5 gap-0.5",
        )}
      >
        <Item
          onClick={(e) => {
            e.stopPropagation();
            handlePlayNext();
          }}
          className={itemClassName}
        >
          <PlaySquare size={iconSize} className="text-primary/70" /> Play Next
        </Item>
        <Item
          onClick={(e) => {
            e.stopPropagation();
            handleAddToQueue();
          }}
          className={itemClassName}
        >
          <ListEnd size={iconSize} className="text-primary/70" /> Add to Queue
        </Item>
        <Separator
          className={cn("bg-primary/10 mx-2", isMobile ? "my-1.5" : "my-1")}
        />
        <Item className={itemClassName}>
          <Pin size={iconSize} className="text-primary/70" /> Pin Song
        </Item>
        <Item className={itemClassName}>
          <Radio size={iconSize} className="text-primary/70" /> Create Station
        </Item>
        <Separator
          className={cn("bg-primary/10 mx-2", isMobile ? "my-1.5" : "my-1")}
        />
        <Item
          className={itemClassName}
          onClick={(e) => {
            e.stopPropagation();
            handleSuggestLess();
          }}
        >
          <ThumbsDown size={iconSize} className="text-primary/70" /> Suggest
          Less
        </Item>
        <Item
          className={itemClassName}
          onClick={(e) => {
            e.stopPropagation();
            handleNeverShowAgain();
          }}
        >
          <Ban size={iconSize} className="text-primary/70" /> Never Show Me This
          Again!
        </Item>
        <Item
          onClick={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          className={itemClassName}
        >
          {copied ? (
            <>
              <Check
                size={iconSize}
                className="text-primary/70 transition-all duration-300 ease-out blur-[0.3px]"
              />
              <span className="transition-all duration-300 ease-out blur-[0.4px]">
                Link copied
              </span>
            </>
          ) : (
            <>
              <Share size={iconSize} className="text-primary/70" />
              <span>Share</span>
            </>
          )}
        </Item>

        {playlistId && normalized.id && (
          <>
            <Separator
              className={cn("bg-primary/10 mx-2", isMobile ? "my-1.5" : "my-1")}
            />
            <Item
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFromPlaylist();
              }}
              className={cn(
                itemClassName,
                "text-rose-500 focus:bg-rose-500/15 focus:text-rose-500",
              )}
            >
              <Trash2 size={iconSize} /> Remove from Playlist
            </Item>
          </>
        )}
      </div>
    </div>
  );

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
              className="group relative flex flex-col gap-3 p-4 rounded-3xl hover:bg-neutral-50 dark:hover:bg-neutral-100/50 transition-all cursor-pointer border border-transparent hover:border-neutral-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:bg-neutral-100/50"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-100 shadow-sm">
                <Image
                  width={500}
                  height={500}
                  unoptimized
                  src={normalized.coverUrl}
                  alt={normalized.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
                  }}
                />
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-all duration-300",
                    isCurrent
                      ? "bg-black/40 opacity-100"
                      : "bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-primary shadow-xl transform transition-transform duration-300",
                      isCurrent || isLoading
                        ? "scale-100"
                        : "scale-75 translate-y-4 group-hover:scale-100 group-hover:translate-y-0",
                    )}
                  >
                    {isLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : isCurrent ? (
                      <Pause size={24} className="fill-primary" />
                    ) : (
                      <Play size={24} className="fill-primary ml-1" />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      "font-bold text-base truncate tracking-tight flex-1",
                      isCurrent ? "text-emerald-600" : "text-neutral-900",
                    )}
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
                        className="p-1 -mr-1 text-primary/70 hover:text-primary cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
                      >
                        <EllipsisVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={menuContainerClass}
                    >
                      {renderMenuItems(DropdownMenuItem, DropdownMenuSeparator)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-sm font-medium text-neutral-500 truncate flex items-center gap-1">
                  <Link
                    href={`/dashboard/artist/${encodeURIComponent(normalized.artist)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline hover:text-neutral-900 transition-colors"
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
                `flex items-center justify-between py-2.5 group cursor-pointer hover:bg-card px-2 -mx-2 rounded-xl border-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-card`,
                className,
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {index > 0 && (
                  <span className="w-4 text-xs font-mono hidden md:block font-bold text-neutral-300 group-hover:text-neutral-400 shrink-0 text-center">
                    {index.toString().padStart(2, "0")}
                  </span>
                )}
                <div className="relative w-11 h-11 overflow-hidden shrink-0 border rounded-sm border-neutral-200 shadow-sm bg-black/50 p-0.5">
                  <Image
                    width={500}
                    height={500}
                    unoptimized
                    src={normalized.coverUrl}
                    className="w-full h-full object-cover select-none rounded-sm"
                    alt={normalized.title}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256";
                    }}
                  />
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all duration-200 rounded-xl",
                      isCurrent
                        ? "bg-black/30 opacity-100"
                        : "bg-neutral-950/20 opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {isLoading ? (
                      <Loader2
                        size={14}
                        className="text-primary animate-spin"
                      />
                    ) : isCurrent ? (
                      <Pause size={14} className="text-primary fill-primary" />
                    ) : (
                      <Play
                        size={14}
                        className="text-primary fill-primary ml-0.5"
                      />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <p
                    className={cn(
                      "text-sm font-bold truncate tracking-tight leading-snug",
                      isCurrent ? "text-highlight" : "text-primary",
                    )}
                  >
                    {normalized.title}
                  </p>
                  <p className="text-xs font-medium text-neutral-400 truncate mt-0.5 leading-none">
                    <Link
                      href={`/dashboard/artist/${encodeURIComponent(normalized.artist)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline hover:text-primary transition-colors z-10 relative"
                    >
                      {normalized.artist}
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {showDuration && (
                  <div className="text-xs font-mono font-bold text-neutral-400 shrink-0 pr-1 group-hover:text-primary transition-colors">
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
                      className="flex items-center gap-1.5 text-primary/70 hover:text-primary cursor-pointer transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                    >
                      <EllipsisVertical size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={menuContainerClass}
                  >
                    {renderMenuItems(DropdownMenuItem, DropdownMenuSeparator)}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </ContextMenuTrigger>

        <ContextMenuContent className={menuContainerClass}>
          {renderMenuItems(ContextMenuItem, ContextMenuSeparator)}
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