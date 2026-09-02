"use client";

import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import {
  normalizeTrack,
  type NormalizableTrack,
  type CanonicalTrack,
} from "@/lib/trackUtils";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  Radio,
  Share,
  EllipsisVertical,
  Star,
} from "@/components/icons";
import {
  ListPlus,
  ThumbsDown,
  Ban,
  PlaySquare,
  ListEnd,
  Trash2,
  Check,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export type MenuSize = "sm" | "md" | "lg";

export interface TrackActionMenuContentProps {
  track: NormalizableTrack | null;
  size?: MenuSize;
  playlistId?: string;
  onOpenPlaylistModal?: (track: CanonicalTrack) => void;
  onClose?: () => void;
  ItemComponent?: React.ElementType;
  SeparatorComponent?: React.ElementType;
}

export function TrackActionMenuContent({
  track,
  size = "md",
  playlistId,
  onOpenPlaylistModal,
  onClose,
  ItemComponent = DropdownMenuItem,
  SeparatorComponent = DropdownMenuSeparator,
}: TrackActionMenuContentProps) {
  const user = useUser();
  const { playNextPriority, addToQueue, dismissTrack } = useGlobalPlayback();
  const [copied, setCopied] = useState(false);

  const rawId =
    track?.trackId ||
    track?.id ||
    track?.audioUrl?.split("id=")[1] ||
    track?.url?.split("?v=")[1];

  const normalized = normalizeTrack(
    track ? { ...track, id: rawId, trackId: rawId } : null
  );

  const isLiked = useQuery(
    api.likes.checkLiked,
    user?._id && normalized?.id
      ? { userId: user._id, trackId: normalized.id }
      : "skip"
  );

  const isBookmarked = useQuery(
    api.library.checkSaved,
    user?._id && normalized?.id
      ? { userId: user._id, itemType: "track", itemId: normalized.id }
      : "skip"
  );

  const toggleLikeMutation = useMutation(api.likes.toggleLike);
  const toggleSaveLibraryItem = useMutation(api.library.toggleSaveItem);
  const removeTrackFromPlaylist = useMutation(api.playlists.removeFromPlaylist);
  const suggestLess = useMutation(api.suggestLess.addToUserSuggestLessTracks);
  const neverShowAgain = useMutation(
    api.neverShowAgain.addToNeverShowAgainTracks
  );

  if (!normalized?.id) return null;

  const sizeStyles = {
    sm: {
      item: "gap-2 rounded-lg text-[12px] py-1.5 px-2 font-medium",
      icon: 14,
      containerPad: "p-1 gap-0.5",
    },
    md: {
      item: "gap-2.5 rounded-xl text-[13px] py-2 px-2.5 font-medium",
      icon: 16,
      containerPad: "p-1.5 gap-0.5",
    },
    lg: {
      item: "gap-3.5 rounded-2xl text-[15px] py-2.5 px-3.5 font-medium",
      icon: 18,
      containerPad: "p-2 gap-1",
    },
  }[size];

  const itemClassName = cn(
    "cursor-pointer outline-none border-none flex items-center select-none transition-colors duration-150",
    "text-neutral-700 dark:text-neutral-200",
    "hover:bg-neutral-900/5 dark:hover:bg-white/10 hover:text-neutral-950 dark:hover:text-white",
    "focus:bg-neutral-900/5 dark:focus:bg-white/10 focus:text-neutral-950 dark:focus:text-white",
    sizeStyles.item
  );

  const destructiveItemClassName = cn(
    itemClassName,
    "hover:bg-rose-500/10 dark:hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400",
    "focus:bg-rose-500/10 dark:focus:bg-rose-500/15 focus:text-rose-600 dark:focus:text-rose-400"
  );

  const handleAction = (callback: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    callback();
    onClose?.();
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

  const handleRemovePlaylist = async () => {
    if (!playlistId || !normalized.id) return;
    await removeTrackFromPlaylist({
      playlistId: playlistId as Id<"playlists">,
      trackId: normalized.id,
    });
  };

  const trackPayload = {
    trackId: normalized.id,
    title: normalized.title,
    artist: normalized.artist,
    coverUrl: normalized.coverUrl,
    duration: normalized.duration,
  };

  const handleSuggestLess = async () => {
    if (!user?._id || !normalized.id) return;
    dismissTrack(normalized.id);
    try {
      await suggestLess({ userId: user._id, ...trackPayload });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNeverShowAgain = async () => {
    if (!user?._id || !normalized.id) return;
    dismissTrack(normalized.id);
    try {
      await neverShowAgain({ userId: user._id, ...trackPayload });
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/dashboard/track/${normalized.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleOpenPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
    onOpenPlaylistModal?.(normalized);
  };

  return (
    <div className={cn("flex flex-col w-full", sizeStyles.containerPad)}>
      <div className="flex items-center justify-around py-1.5 px-2 border-b border-neutral-200/50 dark:bg-white/5 dark:border-white/10 rounded-lg mb-1">
        <button
          onClick={handleAction(handleLike)}
          className={cn(
            "p-1.5 rounded-md hover:scale-110 active:scale-98 transition-all outline-none",
            isLiked ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400"
          )}
          title={isLiked ? "Remove Favorite" : "Favorite"}
        >
          <Star
            size={sizeStyles.icon + 2}
            className={cn(isLiked && "fill-emerald-500 text-emerald-500")}
          />
        </button>


        <button
          onClick={handleAction(handleToggleLibrary)}
          className={cn(
            "p-1.5 rounded-md hover:scale-110 active:scale-98 transition-all outline-none",
            isBookmarked ? "text-emerald-500" : "text-neutral-500 dark:text-neutral-400"
          )}
          title={isBookmarked ? "Saved in Library" : "Save to Library"}
        >
          <Bookmark
            size={sizeStyles.icon + 2}
            className={cn(isBookmarked && "fill-emerald-500 text-emerald-500")}
          />
        </button>

        <button
          onClick={handleOpenPlaylist}
          className="p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:scale-110 active:scale-98 transition-all outline-none"
          title="Add to Playlist"
        >
          <ListPlus size={sizeStyles.icon + 2} />
        </button>
      </div>

      <ItemComponent
        onClick={handleAction(() => playNextPriority(normalized))}
        className={itemClassName}
      >
        <PlaySquare size={sizeStyles.icon} className="text-neutral-500 dark:text-neutral-400" />
        Play Next
      </ItemComponent>

      <ItemComponent
        onClick={handleAction(() => addToQueue(normalized))}
        className={itemClassName}
      >
        <ListEnd size={sizeStyles.icon} className="text-neutral-500 dark:text-neutral-400" />
        Add to Queue
      </ItemComponent>

      <SeparatorComponent className="bg-neutral-200/50 dark:bg-white/10 mx-1.5 my-1" />

      {/* <ItemComponent onClick={handleAction(() => { })} className={itemClassName}>
        <Radio size={sizeStyles.icon} className="text-neutral-500 dark:text-neutral-400" />
        Create Station
      </ItemComponent> */}

      <ItemComponent onClick={handleAction(handleSuggestLess)} className={itemClassName}>
        <ThumbsDown size={sizeStyles.icon} className="text-neutral-500 dark:text-neutral-400" />
        Suggest Less
      </ItemComponent>

      <ItemComponent onClick={handleAction(handleNeverShowAgain)} className={destructiveItemClassName}>
        <Ban size={sizeStyles.icon} className="text-rose-500/80 dark:text-rose-400/80" />
        Never Show Again
      </ItemComponent>

      <SeparatorComponent className="bg-neutral-200/50 dark:bg-white/10 mx-1.5 my-1" />

      <ItemComponent onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleShare(); }} className={itemClassName}>

        {copied ? (
          <>
            <Check size={sizeStyles.icon} className="text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">Link Copied</span>
          </>
        ) : (
          <>
            <Share size={sizeStyles.icon} className="text-neutral-500 dark:text-neutral-400" />
            <span>Share Link</span>
          </>
        )}
      </ItemComponent>

      {playlistId && (
        <>
          <SeparatorComponent className="bg-neutral-200/50 dark:bg-white/10 mx-1.5 my-1" />
          <ItemComponent
            onClick={handleAction(handleRemovePlaylist)}
            className={cn(destructiveItemClassName, "text-rose-600 dark:text-rose-400")}
          >
            <Trash2 size={sizeStyles.icon} />
            Remove from Playlist
          </ItemComponent>
        </>
      )}
    </div>
  );
}

export interface TrackDropdownMenuProps {
  track: NormalizableTrack | null;
  size?: MenuSize;
  playlistId?: string;
  onOpenPlaylistModal?: (track: CanonicalTrack) => void;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function TrackDropdownMenu({
  track,
  size = "md",
  playlistId,
  onOpenPlaylistModal,
  trigger,
  align = "end",
  side = "bottom",
  className,
}: TrackDropdownMenuProps) {
  const [open, setOpen] = useState(false);

  const widthClass = {
    sm: "w-[190px]",
    md: "w-[215px]",
    lg: "w-[250px]",
  }[size];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {trigger || (
          <button className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md">
            <EllipsisVertical
              size={size === "sm" ? 14 : size === "md" ? 16 : 18}
            />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        className={cn("z-[9999]", widthClass, className)}
      >
        <TrackActionMenuContent
          track={track}
          size={size}
          playlistId={playlistId}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onClose={() => setOpen(false)}
          ItemComponent={DropdownMenuItem}
          SeparatorComponent={DropdownMenuSeparator}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}