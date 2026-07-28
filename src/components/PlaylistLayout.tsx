"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  Play,
  Shuffle,
  ListFilter,
  ArrowDownAZ,
  ArrowUpZA,
  Loader2, 
  Clock,
} from "lucide-react";
import { Button, ButtonGroup } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropodown-menu";
import { Track } from "@/components/TrackComponent";
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
  [key: string]: any; // Allows custom properties without TS errors
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
}: PlaylistLayoutProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ALWAYS call hooks before any early returns
  const sortedTracks = useMemo(() => {
    if (!tracks) return [];
    const withIndex = tracks.map((t, i) => ({ ...t, originalIndex: i }));
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
  }, [tracks, sortColumn, sortOrder]);

  // Early return safely placed AFTER hooks
  if (isLoading || tracks === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-20 bg-background">
        <LoaderState />
      </div>
    );
  }

  const hasTracks = sortedTracks.length > 0;

  return (
    <div className={cn("flex bg-background text-foreground", className)}>
      <main className="flex-1 p-6 md:p-10 min-w-0 pb-32">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
          <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 bg-card border border-foreground/10 overflow-hidden rounded-md">
            {coverNode}
          </div>
          <div className="flex flex-col gap-2 pb-2 flex-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-widest text-foreground/60">
              Playlist
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm font-medium text-foreground/50 max-w-2xl mt-2 line-clamp-2">
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

          <ButtonGroup separator={true}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground/70 hover:text-foreground hover:bg-foreground/10"
                >
                  <ListFilter size={14} className="mr-1.5" />
                  <span className="capitalize">By {sortColumn}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setSortColumn("date")}>
                  Date Added
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortColumn("title")}>
                  Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortColumn("artist")}>
                  Artist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortColumn("duration")}>
                  Duration
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="w-10 px-0 text-foreground/60 hover:text-foreground/10"
            >
              {sortOrder === "asc" ? (
                <ArrowDownAZ size={16} />
              ) : (
                <ArrowUpZA size={16} />
              )}
            </Button>
          </ButtonGroup>
        </div>

        {!hasTracks ? (
          <div className="py-20 text-center border-t border-foreground/10">
            {emptyIcon}
            <p className="font-bold text-foreground/80">{emptyText}</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="hidden sm:grid grid-cols-[16px_1fr_auto_auto] gap-4 px-4 py-2 border-b border-foreground/10 mb-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <span>#</span>
              <span>Title</span>
              <span className="w-24 text-right">Artist</span>
              <span className="w-16 flex justify-end">
                <Clock size={14} />
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {sortedTracks.map((track, index) => {
                if (!track) return null;

                if (renderTrack) {
                  return renderTrack(track, index, sortedTracks);
                }
                return (
                  <Track
                    key={track._id}
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
      </main>
    </div>
  );
}

function LoaderState() {
  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-foreground/40" size={32} />
    </div>
  );
}