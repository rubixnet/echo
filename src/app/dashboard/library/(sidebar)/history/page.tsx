"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, History, Loader2, Trash2, Shuffle, ListFilter, ArrowDownAZ, ArrowUpZA, Clock } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button"
import { Track } from "@/components/TrackComponent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropodown-menu";

type SortColumn = 'date' | 'title' | 'artist' | 'duration';
type SortOrder = 'asc' | 'desc';

export default function ListeningHistoryPage() {
  const user = useUser();
  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const { playTrack } = useGlobalPlayback();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const removeHistoryItem = useMutation(api.history.removeHistoryItem);
  const historySongs = useQuery(
    api.history.getUserHistory,
    user?._id ? { userId: user._id } : "skip"
  );

  if (historySongs === undefined) return <div>Loading history...</div>;


  const totalDurationStr = useMemo(() => {
    if (!historySongs) return "0 min";
    const totalSeconds = historySongs.reduce((acc, track) => {
      if (!track?.duration) return acc;
      const [m, s] = track.duration.split(':').map(Number);
      return acc + ((m || 0) * 60 + (s || 0));
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  }, [historySongs]);

  const handleRemoveFromHistory = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    track: any
  ) => {
    e.stopPropagation();
    if (!user?._id) return;

    try {
      await removeHistoryItem({
        historyId: track._id,
      });
    } catch (error) {
      console.error("Failed to remove song from history", error);
    }


  }
  const sortedTracks = useMemo(() => {
        if (!historySongs) return [];

        const tracksWithOriginalIndex = historySongs.map((t, index) => ({ ...t, originalIndex: index }));

        return tracksWithOriginalIndex.sort((a, b) => {
            let comparison = 0;

            if (sortColumn === 'title') {
                comparison = (a.title || "").localeCompare(b.title || "");
            } else if (sortColumn === 'artist') {
                comparison = (a.artist || "").localeCompare(b.artist || "");
            } else if (sortColumn === 'duration') {
                const getSecs = (dur: string) => {
                    const [m, s] = (dur || "0:00").split(':').map(Number);
                    return (m * 60) + s;
                };
                comparison = getSecs(a.duration) - getSecs(b.duration);
            } else {
                comparison = a.originalIndex - b.originalIndex;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [historySongs, sortColumn, sortOrder]);

  const hasTracks = historySongs.length > 0;

  return (
    <div className="flex bg-background text-foreground">
      <main className="flex-1 p-6 md:p-10 min-w-0 pb-32">

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
          <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 bg-card border 
                  
       bg-gradient-to-br from-sky-400 to-blue-600  flex items-center justify-center border-foreground/10 shadow-2xl overflow-hidden rounded-md">
            <History size={125} className=" text-white" />
          </div>


          <div className="flex flex-col gap-2 pb-2 flex-1 min-w-0">
            <span className="text-xs font-black uppercase tracking-widest text-foreground/60">Playlist</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground truncate">Recently Played</h1>
            <div className="flex items-center gap-2 text-sm font-bold text-foreground/70 mt-2">
              <span className="text-foreground">{user?.name || "You"}</span>
              <span className="text-foreground/40">•</span>
              <span>{historySongs.length} songs, {totalDurationStr}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <ButtonGroup separator={true}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasTracks}
              onClick={() => playTrack({ ...sortedTracks[0], youtubeId: sortedTracks[0].audioUrl?.split("id=")[1] || sortedTracks[0].youtubeId }, setLoadingId, sortedTracks, 0)}
              className=" text-foreground/80 hover:text-foreground hover:bg-foreground/10"
            >
              <Play size={16} fill="currentColor" className="mr-2" /> Play
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-10 px-0 text-foreground/50 hover:text-foreground hover:bg-foreground/10"
            >
              <Shuffle size={16} />
            </Button>
          </ButtonGroup>

          <ButtonGroup separator={true}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground hover:bg-foreground/10">
                  <ListFilter size={14} className="mr-1.5" />
                  <span className="capitalize">By {sortColumn}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setSortColumn('date')}>Date Added</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortColumn('title')}>Title</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortColumn('artist')}>Artist</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortColumn('duration')}>Duration</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="w-10 px-0 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
            >
              {sortOrder === 'asc' ? <ArrowDownAZ size={16} /> : <ArrowUpZA size={16} />}
            </Button>
          </ButtonGroup>
        </div>
        {!hasTracks ? (
          <div className="py-20 text-center border-t border-foreground/10">
            <History className="mx-auto mb-4 text-foreground/30" size={48} />
            <p className="font-bold text-foreground/80">No liked songs yet.</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="hidden sm:grid grid-cols-[16px_1fr_auto_auto] gap-4 px-4 py-2 border-b border-foreground/10 mb-2 text-xs font-black uppercase tracking-widest text-foreground/40">
              <span>#</span>
              <span>Title</span>
              <span className="w-24 text-right">Artist</span>
              <span className="w-16 flex justify-end"><Clock size={14} /></span>
            </div>
            <div className="flex flex-col gap-1">
              {sortedTracks.map((track, index) => {
                if (!track) return null;
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

        )
        }
      </main>

    </div >
  );
}