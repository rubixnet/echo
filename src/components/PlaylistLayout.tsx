"use client";

import React, { ReactNode, useMemo, useState } from "react";
import {
  Play,
  Shuffle,
  ListFilter,
  ArrowUpDown,
  ArrowDownUp,
  SearchIcon,
  Check,
  PenLine,
  Pin,
  Trash,
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
import { useDominantColor } from "@/components/GlobalPlayer/Shared";
import { useSearchFilter } from "@/hooks/useSearchFilter";
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
  trackId?: string;
  [key: string]: unknown;
};

type PlaylistLayoutProps = {
  coverNode: ReactNode;
  coverUrl?: string;
  title: string;
  subtitle?: ReactNode;
  metaLine?: ReactNode;
  tracks: TrackLike[] | null | undefined;
  isLoading?: boolean;
  onPlayFirst?: (sortedTracks: TrackLike[]) => void;
  renderTrack?: (
    track: TrackLike,
    allTracks: TrackLike[],
    index: number,
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
  coverUrl,
  title,
  subtitle,
  metaLine,
  tracks,
  isLoading = false,
  onPlayFirst,
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleSort = () =>
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));

  let imageUrl = coverUrl;
  if (!imageUrl && React.isValidElement(coverNode)) {
    imageUrl = (coverNode.props as { src?: string }).src;
  }

  const handleShuffle = () => {
    if (!tracks) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    onPlayFirst?.(shuffled);
    setLoadingId(shuffled[0]._id);
  };

  const rgb = useDominantColor(imageUrl);

  const filtered = useSearchFilter(tracks, searchTerm, ["title", "artist"]);

  const sortedTracks = useMemo(() => {
    if (sortColumn === "date") return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "title")
        cmp = (a.title || "").localeCompare(b.title || "");
      if (sortColumn === "artist")
        cmp = (a.artist || "").localeCompare(b.artist || "");
      if (sortColumn === "duration") {
        const getSecs = (d: string) => {
          const [m, s] = (d || "0:00").split(":").map(Number);
          return (m || 0) * 60 + (s || 0);
        };
        cmp = getSecs(a.duration || "0:00") - getSecs(b.duration || "0:00");
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortColumn, sortOrder]);

  if (isLoading || tracks === undefined) {
    return <PlaylistLayoutSkeleton className={className} />;
  }

  const hasTracks = sortedTracks.length > 0;
  const filters: SortColumn[] = ["date", "title", "artist", "duration"];
  const showActions = isOwner && isPlaylistPage;

  const isValidRgb = Array.isArray(rgb) && rgb.length >= 3 && !isNaN(rgb[0]);

  const r = isValidRgb ? rgb[0] : 150;
  const g = isValidRgb ? rgb[1] : 150;
  const b = isValidRgb ? rgb[2] : 150;

  const maxVal = Math.max(r, g, b, 10);
  const scale = maxVal < 100 ? 2.5 : maxVal < 150 ? 1.5 : 1;
  const lr = Math.min(255, Math.round(r * scale));
  const lg = Math.min(255, Math.round(g * scale));
  const lb = Math.min(255, Math.round(b * scale));

  return (
    <div
      className={cn(
        "relative w-full min-h-full p-6 md:p-10 pb-32 text-foreground bg-background",
        className,
      )}
    >
      <div
        className={cn(
          "absolute -top-24 -left-10 md:-left-8 right-0 pointer-events-none transition-colors duration-700 ease-in-out z-0 h-[500px] md:h-[600px] lg:h-[400px] blur-3xl",
          "[--bg-r:var(--lr)] [--bg-g:var(--lg)] [--bg-b:var(--lb)] [--bg-op1:0.8] [--bg-op2:0.4]",
          "dark:[--bg-r:var(--dr)] dark:[--bg-g:var(--dg)] dark:[--bg-b:var(--db)] dark:[--bg-op1:0.6] dark:[--bg-op2:0.2]",
        )}
        style={
          {
            "--lr": lr,
            "--lg": lg,
            "--lb": lb,
            "--dr": r,
            "--dg": g,
            "--db": b,

            background: isValidRgb
              ? `radial-gradient(220% 100% at 0% 0%, 
            rgba(var(--bg-r), var(--bg-g), var(--bg-b), var(--bg-op1)) 0%, 
            rgba(var(--bg-r), var(--bg-g), var(--bg-b), var(--bg-op2)) 55%, 
            rgba(var(--bg-r), var(--bg-g), var(--bg-b), 0) 100%
          )`
              : "transparent",
          } as React.CSSProperties
        }
      />
      <div className="relative z-10 w-full">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
          <div className="flex flex-row justify-between">
            <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 bg-card border border-foreground/10 overflow-hidden rounded-md ">
              {coverNode}
            </div>
            <div className="fixed inset-x-0 top-4 z-50 px-6 md:hidden">
              <div className="flex justify-end">
                <ButtonGroup separator={false}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-10 px-0 text-foreground/70"
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                  >
                    <SearchIcon
                      size={16}
                      className={showMobileSearch ? "text-primary" : ""}
                    />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-10 px-0 text-foreground/70"
                      >
                        <ListFilter size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 shadow-none"
                    >
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
                    className="w-10 px-0 text-foreground/70"
                    onClick={toggleSort}
                  >
                    {sortOrder === "desc" ? (
                      <ArrowDownUp size={16} />
                    ) : (
                      <ArrowUpDown size={16} />
                    )}
                  </Button>
                </ButtonGroup>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pb-2 flex-1 min-w-0 justify-end">
            <span className="text-xs font-black uppercase tracking-widest text-foreground/80">
              Playlist
            </span>
            <h1 className="text-4xl md:text-5xl font-black capitalize tracking-tighter text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm font-medium text-foreground/80 max-w-2xl mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
            {metaLine && (
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/90 mt-2">
                {metaLine}
              </div>
            )}
          </div>
        </div>

        <div className="flex md:hidden items-center justify-between -mx-6 px-6 py-3 mb-6 ">
          <Button
            size="default"
            className="w-11 px-0 text-foreground/70"
            onClick={handleShuffle}
          >
            <Shuffle size={16} />
          </Button>

          {showActions && (
            <ButtonGroup size="default" separator={false}>
              <Button
                variant="ghost"
                className="h-full w-10 px-0 text-foreground/70"
                onClick={onEdit}
              >
                <PenLine size={16} />
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "h-full w-10 px-0 text-foreground/70",
                  isPinned && "text-foreground",
                )}
                onClick={onTogglePin}
              >
                <Pin size={16} className={isPinned ? "fill-current" : ""} />
              </Button>
              <Button
                variant="ghost"
                className="h-full w-10 px-0 text-foreground/70"
                onClick={onDelete}
              >
                <Trash size={16} />
              </Button>
            </ButtonGroup>
          )}

          <Button
            size="default"
            className="w-11 px-0 text-foreground/70"
            disabled={!hasTracks || !onPlayFirst}
            onClick={() => onPlayFirst?.(sortedTracks)}
          >
            <Play size={16} fill="currentColor" />
          </Button>
        </div>

        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            showMobileSearch ? "h-12 opacity-100 mb-4" : "h-0 opacity-0 mb-0",
          )}
        >
          <LiquidContainer radius="50px" className="h-10 w-full shadow-none">
            <input
              type="text"
              placeholder="Search Playlist"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full bg-transparent pl-4 pr-2 text-sm text-foreground focus:outline-none placeholder:text-foreground/50"
            />
          </LiquidContainer>
        </div>

        <div className="hidden md:flex items-center justify-between mb-8">
          <div className="flex gap-2">
            <ButtonGroup separator={true}>
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasTracks || !onPlayFirst}
                onClick={() => onPlayFirst?.(sortedTracks)}
                className="text-foreground/90 hover:text-foreground hover:bg-foreground/10"
              >
                <Play size={16} fill="currentColor" className="mr-2" />
                Play
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 px-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                onClick={handleShuffle}
              >
                <Shuffle size={16} />
              </Button>
            </ButtonGroup>

            {showActions && (
              <ButtonGroup separator={false}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 px-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                  onClick={onEdit}
                  title="Edit playlist"
                >
                  <PenLine size={16} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-10 px-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10",
                    isPinned && "text-foreground",
                  )}
                  onClick={onTogglePin}
                  title={isPinned ? "Unpin playlist" : "Pin playlist"}
                >
                  <Pin size={16} className={isPinned ? "fill-current" : ""} />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 px-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10"
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
                onClick={toggleSort}
                className="w-10 px-0 text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
              >
                {sortOrder === "desc" ? (
                  <ArrowDownUp size={16} />
                ) : (
                  <ArrowUpDown size={16} />
                )}
              </Button>
            </ButtonGroup>
            <LiquidContainer radius="50px" className="h-11">
              <input
                type="text"
                placeholder="Search Playlist"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="relative z-10 pr-12 shadow-none w-full h-full bg-transparent pl-4 text-foreground placeholder:text-foreground/60 focus:outline-none"
              />
              <div className="absolute inset-y-0 -right-1 flex items-center pr-4 z-20">
                <button
                  type="button"
                  className="p-1.5 text-foreground/60 hover:text-foreground transition-colors cursor-default pointer-events-none"
                >
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
            <div className="flex flex-col gap-1">
              {sortedTracks.map((track, trackIndex) => {
                if (!track) return null;

                const trackKey = track._id;

                if (renderTrack) {
                  return (
                    <React.Fragment key={trackKey}>
                      {renderTrack(track, sortedTracks, trackIndex)}
                    </React.Fragment>
                  );
                }
                return (
                  <Track
                    key={trackKey}
                    track={track}
                    index={undefined}
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
    </div>
  );
}

export function PlaylistLayoutSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full min-h-full p-6 md:p-10 pb-32 text-foreground bg-background",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
        <div>
          <div className="flex justify-between">
            <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 bg-foreground/10 rounded-md animate-pulse" />
            <div className="h-11 md:hidden w-30 bg-foreground/10 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col gap-3 pb-2 flex-1 min-w-0 justify-end">
          <div className="h-3 w-16 bg-foreground/10 rounded-sm animate-pulse" />
          <div className="h-10 w-2/3 bg-foreground/10 rounded-md animate-pulse" />
          <div className="h-4 hidden w-1/2 bg-foreground/10 rounded-sm animate-pulse" />
          <div className="h-4 w-1/4 bg-foreground/10 rounded-sm animate-pulse mt-2" />
        </div>
      </div>

      <div className="md:flex hidden items-center justify-between mb-8">
        <div className="flex gap-2">
          <div className="h-11 w-30 bg-foreground/10 rounded-full animate-pulse" />
          <div className="h-11 w-30 bg-foreground/10 rounded-full animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-11 w-20 bg-foreground/10 rounded-full animate-pulse" />
          <div className="h-11 w-48 bg-foreground/10 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between mb-8 mt-11">
        <div className="h-11 w-11 rounded-full bg-foreground/10 animate-pulse" />
        <div className="h-11 w-30 bg-foreground/10 rounded-full animate-pulse" />
        <div className="h-11 w-11 rounded-full bg-foreground/10 animate-pulse" />
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
      <div className="w-10 h-10 bg-foreground/10 rounded-md animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 w-1/3 bg-foreground/10 rounded-sm animate-pulse" />
        <div className="h-3 w-1/5 bg-foreground/10 rounded-sm animate-pulse" />
      </div>
      <div className="w-12 h-3 bg-foreground/10 rounded-sm animate-pulse shrink-0" />
    </div>
  );
}
