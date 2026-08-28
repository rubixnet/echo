"use client";

import * as React from "react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
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
} from "@/components/ui/dropodown-menu";
import {
  Bookmark,
  ListPlus,
  Radio,
  Share,
  ThumbsDown,
  Ban,
  EllipsisVertical,
} from "lucide-react";

export type MenuSize = "sm" | "md" | "lg";

export interface TrackActionMenuContentProps {
  track: NormalizableTrack | null;
  size?: MenuSize;
  onOpenPlaylistModal?: (track: CanonicalTrack) => void;
  onClose?: () => void;
  ItemComponent?: React.ElementType;
  SeparatorComponent?: React.ElementType;
}

export function TrackActionMenuContent({
  track,
  size = "md",
  onOpenPlaylistModal,
  onClose,
  ItemComponent = DropdownMenuItem,
  SeparatorComponent = DropdownMenuSeparator,
}: TrackActionMenuContentProps) {
  const user = useUser();
  const normalized = normalizeTrack(track);

  const isBookmarked = useQuery(
    api.library.checkSaved,
    user?._id && normalized?.id
      ? { userId: user._id, itemType: "track", itemId: normalized.id }
      : "skip",
  );

  const toggleSaveLibraryItem = useMutation(api.library.toggleSaveItem);
  const suggestLess = useMutation(api.suggestLess.addToUserSuggestLessTracks);
  const neverShowAgain = useMutation(
    api.neverShowAgain.addToNeverShowAgainTracks,
  );

  if (!normalized?.id) return null;

  const sizeStyles = {
    sm: {
      item: "gap-2 rounded-md text-[12px] py-1.5 px-2 font-medium",
      icon: 14,
      containerPad: "p-1 gap-0.5",
    },
    md: {
      item: "gap-2.5 rounded-md text-[13px] py-2 px-2.5 font-medium",
      icon: 16,
      containerPad: "p-1.5 gap-0.5",
    },
    lg: {
      item: "gap-3.5 rounded-xl text-[15px] py-3 px-3.5 font-medium",
      icon: 20,
      containerPad: "p-2 gap-1",
    },
  }[size];

  const itemClassName = cn(
    "cursor-pointer focus:bg-background focus:text-primary text-primary/90 outline-none border-none flex items-center transition-colors select-none",
    sizeStyles.item,
  );

  const handleAction = (callback: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    callback();
    onClose?.();
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

  const trackInfo = {
    trackId: normalized.id,
    title: normalized.title,
    artist: normalized.artist,
    coverUrl: normalized.coverUrl,
    duration: normalized.duration,
  };



  const handleShare = () => {
    const url = `${window.location.origin}/track/${normalized.id}`;
    navigator.clipboard.writeText(url);
  };

  const handleSuggestLess = async () => {
    if (!user?._id || !normalized.id) return;
    try {
      await suggestLess({ userId: user._id, ...trackInfo });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNeverShowAgain = async () => {
    if (!user?._id || !normalized.id) return;
    try {
      await neverShowAgain({ userId: user._id, ...trackInfo });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
    onOpenPlaylistModal?.(normalized);
  };

  return (
    <div
      className={cn(
        "flex flex-col w-full text-primary",
        sizeStyles.containerPad,
      )}
    >
      <ItemComponent onClick={handleOpenPlaylist} className={itemClassName}>
        <ListPlus size={sizeStyles.icon} className="text-primary/70" />
        Add to Playlist
      </ItemComponent>

      <ItemComponent
        onClick={handleAction(handleToggleLibrary)}
        className={itemClassName}
      >
        <Bookmark
          size={sizeStyles.icon}
          className={cn(
            "text-primary/70",
            isBookmarked && "fill-primary text-primary",
          )}
        />
        {isBookmarked ? "Remove from Library" : "Save to Library"}
      </ItemComponent>

      <ItemComponent onClick={handleAction(() => { })} className={itemClassName}>
        <Radio size={sizeStyles.icon} className="text-primary/70" />
        Create Station
      </ItemComponent>

      <SeparatorComponent className="bg-primary/10 mx-2 my-1" />

      <ItemComponent
        onClick={handleAction(handleSuggestLess)}
        className={itemClassName}
      >
        <ThumbsDown size={sizeStyles.icon} className="text-primary/70" />
        Suggest Less
      </ItemComponent>

      <ItemComponent
        onClick={handleAction(handleNeverShowAgain)}
        className={itemClassName}
      >
        <Ban size={sizeStyles.icon} className="text-primary/70" />
        Never Show Again
      </ItemComponent>

      <SeparatorComponent className="bg-primary/10 mx-2 my-1" />

      <ItemComponent
        onClick={handleAction(handleShare)}
        className={itemClassName}
      >
        <Share size={sizeStyles.icon} className="text-primary/70" />
        Share Link
      </ItemComponent>
    </div>
  );
}

export interface TrackDropdownMenuProps {
  track: NormalizableTrack | null;
  size?: MenuSize;
  onOpenPlaylistModal?: (track: CanonicalTrack) => void;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function TrackDropdownMenu({
  track,
  size = "md",
  onOpenPlaylistModal,
  trigger,
  align = "end",
  side = "bottom",
  className,
}: TrackDropdownMenuProps) {
  const [open, setOpen] = useState(false);

  const widthClass = {
    sm: "w-[185px] rounded-xl",
    md: "w-[210px] rounded-2xl",
    lg: "w-[245px] rounded-[22px]",
  }[size];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
        className={cn(
          "backdrop-blur-xl p-0 z-[9999] overflow-hidden bg-transparent animate-in fade-in-0 zoom-in-95",
          widthClass,
          className,
        )}
      >
        <TrackActionMenuContent
          track={track}
          size={size}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onClose={() => setOpen(false)}
          ItemComponent={DropdownMenuItem}
          SeparatorComponent={DropdownMenuSeparator}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
