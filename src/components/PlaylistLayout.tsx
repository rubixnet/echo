"use client";

import React, { ReactNode, useMemo, useState } from "react";
import {
  Play,
  Shuffle,
  ListFilter,
  ArrowUpDown,
  ArrowDownUp,
  SearchIcon,
  Clock,
  Check,
  PenLine,
  Pin,
  Trash
} from "lucide-react";
import { Button, ButtonGroup } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropodown-menu";
import { Track } from "@/components/TrackComponent";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { cn } from "@/lib/utils";

type SortColumn = "date" | "title" | "artist" | "duration";
type SortOrder = "asc" | "desc";

export type TrackLike = {
  _id: string;
  title?: string;
  artist?: string;
  duration?: string;
  coverUrl?: string;
  audioUrl?: string;
  youtubeId?: string;
  [key: string]: any;
};

type PlaylistLayoutProps = {
  coverNode: ReactNode;
  title: string;
  subtitle?: ReactNode;
  metaLine?: ReactNode;
  tracks: TrackLike[] | null | undefined;
  isLoading?: boolean;
  onPlayFirst?: (sortedTracks: TrackLike[]) => void;
  onShuffle?: () => void;
  renderTrack?: (
    track: TrackLike,
    index: number,
    allTracks: TrackLike[]
  ) => ReactNode;
  emptyIcon?: ReactNode;
  emptyText?: string;
  className?: string;
  isOwner?: boolean;
  
  isPlaylistPage?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function PlaylistLayout({
  coverNode,
  title,
  subtitle,
  metaLine,
  tracks,
  isLoading = false,
  onPlayFirst,
  onShuffle,
  renderTrack,
  emptyIcon,
  emptyText = "No tracks yet.",
  className,

  isOwner = false,
  isPlaylistPage = false,
  isPinned = false,
  onTogglePin,
  onEdit,
  onDelete,
}: PlaylistLayoutProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState(title);
  const [playlistDescription, setPlaylistDescription] = useState(subtitle);

  const sortedTracks = useMemo(() => {
    if (!tracks) return [];

    const filtered = tracks.filter((t) => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      const matchTitle = (t.title || "").toLowerCase().includes(query);
      const matchArtist = (t.artist || "").toLowerCase().includes(query);
      return matchTitle || matchArtist;
    });

    const withIndex = filtered.map((t, i) => ({ ...t, originalIndex: i }));
    return withIndex.sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else if (sortColumn === "artist") {
        cmp = (a.artist || "").localeCompare(b.artist || "");
      } else if (sortColumn === "duration") {
        const getSecs = (d: string) => {
          const [m, s] = (d || "0:00").split(":").map(Number);
          return (m || 0) * 60 + (s || 0);
        };
        cmp = getSecs(a.duration || "0:00") - getSecs(b.duration || "0:00");
      } else {
        cmp = a.originalIndex - b.originalIndex;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [tracks, sortColumn, sortOrder, searchTerm]);

  if (isLoading || tracks === undefined) {
    return <PlaylistLayoutSkeleton className={className} />;
  }

  const hasTracks = sortedTracks.length > 0;
  const filters: SortColumn[] = ["date", "title", "artist", "duration"];

  const showActions = isOwner && isPlaylistPage;

  return (
    <div className={cn("w-full min-h-full p-6 md:p-10 pb-32 text-foreground bg-background", className)}>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
        <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 bg-card border border-foreground/10 overflow-hidden rounded-md shadow-sm">
          {coverNode}
        </div>
        <div className="flex flex-col gap-2 pb-2 flex-1 min-w-0 justify-end">
          <span className="text-xs font-black uppercase tracking-widest text-foreground/60">
            Playlist
          </span>
          <h1 className="text-4xl md:text-5xl font-black capitalize tracking-tighter text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-foreground/50 max-w-2xl mt-1 line-clamp-2">
              {subtitle}
            </p>
          )}
          {metaLine && (
            <div className="flex items-center gap-2 text-sm font-bold text-foreground/70 mt-2">
              {metaLine}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <ButtonGroup separator={true}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasTracks || !onPlayFirst}
              onClick={() => onPlayFirst?.(sortedTracks)}
              className="text-foreground/80 hover:text-foreground hover:bg-foreground/10"
            >
              <Play size={16} fill="currentColor" className="mr-2" />
              Play
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-10 px-0 text-foreground/50 hover:text-foreground hover:bg-foreground/10"
              onClick={onShuffle}
            >
              <Shuffle size={16} />
            </Button>
          </ButtonGroup>

          {showActions && (
            <ButtonGroup separator={false}>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 px-0 text-foreground/50 hover:text-foreground hover:bg-foreground/10"
                onClick={onEdit}
                title="Edit playlist"
              >
                <PenLine size={16} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-10 px-0 text-foreground/50 hover:text-foreground hover:bg-foreground/10",
                  isPinned && "text-foreground"
                )}
                onClick={onTogglePin}
                title={isPinned ? "Unpin playlist" : "Pin playlist"}
              >
                <Pin size={16} className={isPinned ? "fill-current" : ""} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-10 px-0 text-foreground/50 hover:text-foreground hover:bg-foreground/10"
                onClick={onDelete}
                title="Delete playlist"
              >
                <Trash size={16} />
              </Button>
            </ButtonGroup>
          )}
        </div>

        <div className="flex items-center gap-1">
          <ButtonGroup separator={false}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 px-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                >
                  <ListFilter size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {filters.map((filter) => {
                  const isSelected = sortColumn === filter;
                  return (
                    <DropdownMenuItem
                      key={filter}
                      onClick={() => setSortColumn(filter)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex w-4 items-center justify-center">
                          {isSelected && <Check className="h-4 w-4" />}
                        </span>
                        <span className="capitalize">{filter}</span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="w-10 px-0 text-foreground/60 hover:bg-foreground/10"
            >
              {sortOrder === "desc" ? (
                <ArrowDownUp size={16} />
              ) : (
                <ArrowUpDown size={16} />
              )}
            </Button>
          </ButtonGroup>
          <LiquidContainer radius="50px" className="h-10">
            <input
              type="text"
              placeholder="Search Playlist"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="relative z-10 pr-12 w-full h-full bg-transparent pl-4 text-foreground placeholder:text-foreground/40 focus:outline-none"
            />
            <div className="absolute inset-y-0 -right-1 flex items-center pr-4 z-20">
              <button type="submit" className="p-1.5 text-foreground/40 hover:text-foreground transition-colors cursor-pointer">
                <SearchIcon size={20} />
              </button>
            </div>
          </LiquidContainer>
        </div>
      </div>

      {!hasTracks ? (
        <div className="py-20 text-center border-t border-foreground/10">
          {emptyIcon}
          <p className="font-bold text-foreground/80">
            {searchTerm ? `No tracks matching "${searchTerm}"` : emptyText}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <div className="hidden sm:grid grid-cols-[16px_1fr_auto_auto] gap-3 px-1 py-2 border-b border-foreground/10 mb-2 text-xs font-black uppercase tracking-widest text-foreground/40">
            <span>#</span>
            <span>Title</span>
            <span className="w-16 flex justify-end mr-5">
              <Clock size={14} />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {sortedTracks.map((track, index) => {
              if (!track) return null;

              const trackKey = track._id || index;

              if (renderTrack) {
                return (
                  <React.Fragment key={trackKey}>
                    {renderTrack(track, index, sortedTracks)}
                  </React.Fragment>
                );
              }

              return (
                <Track
                  key={trackKey}
                  track={track}
                  index={index + 1}
                  variant="row"
                  loadingId={loadingId}
                  setLoadingId={setLoadingId}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaylistLayoutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full min-h-full p-6 md:p-10 pb-32 text-foreground bg-background", className)}>
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
        <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 bg-foreground/10 rounded-md animate-pulse" />
        <div className="flex flex-col gap-3 pb-2 flex-1 min-w-0 justify-end">
          <div className="h-3 w-16 bg-foreground/10 rounded-sm animate-pulse" />
          <div className="h-10 w-2/3 bg-foreground/10 rounded-md animate-pulse" />
          <div className="h-4 w-1/2 bg-foreground/10 rounded-sm animate-pulse" />
          <div className="h-4 w-1/4 bg-foreground/10 rounded-sm animate-pulse mt-2" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-foreground/10 rounded-md animate-pulse" />
          <div className="h-9 w-10 bg-foreground/10 rounded-md animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-20 bg-foreground/10 rounded-md animate-pulse" />
          <div className="h-10 w-48 bg-foreground/10 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-[16px_1fr_auto_auto] gap-3 px-1 py-2 border-b border-foreground/10 mb-2 text-xs font-black uppercase tracking-widest text-foreground/40">
        <span>#</span>
        <span>Title</span>
        <span className="w-16 flex justify-end mr-5">
          <Clock size={14} />
        </span>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <TrackRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-2 py-2.5 rounded-md border-b border-foreground/5 sm:border-none">
      <div className="w-4 h-4 bg-foreground/10 rounded-sm animate-pulse shrink-0" />
      <div className="w-10 h-10 bg-foreground/10 rounded-md animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 w-1/3 bg-foreground/10 rounded-sm animate-pulse" />
        <div className="h-3 w-1/5 bg-foreground/10 rounded-sm animate-pulse" />
      </div>
      <div className="w-12 h-3 bg-foreground/10 rounded-sm animate-pulse shrink-0" />
    </div>
  );
}