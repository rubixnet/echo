"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { Play, Music, Loader2, Clock, Shuffle, ListFilter, ArrowDownAZ, ArrowUpZA, Heart } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { Track } from "@/components/TrackComponent";
import { cn } from "@/lib/utils";
import { Button, ButtonGroup } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropodown-menu";

type SortColumn = 'date' | 'title' | 'artist' | 'duration';
type SortOrder = 'asc' | 'desc';

export default function PlaylistPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = use(params);
    const user = useUser();
    const playlistId = resolvedParams.id as string;

    const { playTrack } = useGlobalPlayback();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const [sortColumn, setSortColumn] = useState<SortColumn>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip");
    const playlist = playlists?.find((p) => p._id === playlistId);
    const tracks = useQuery(api.playlists.getPlaylistTracks, { playlistId });
    const likedSongs = useQuery(api.likes.getMyLikes, user?._id ? { userId: user._id } : "skip");

    const totalDurationStr = useMemo(() => {
        if (!tracks) return "0 min";
        const totalSeconds = tracks.reduce((acc, track) => {
            if (!track?.duration) return acc;
            const [m, s] = track.duration.split(':').map(Number);
            return acc + ((m || 0) * 60 + (s || 0));
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
    }, [tracks]);

    const sortedTracks = useMemo(() => {
        if (!tracks) return [];

        const tracksWithOriginalIndex = tracks.map((t, index) => ({ ...t, originalIndex: index }));

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
    }, [tracks, sortColumn, sortOrder]);

    if (playlists === undefined || tracks === undefined || likedSongs === undefined) {
        return (
            <div className="flex h-full items-center justify-center p-20 bg-background">
                <Loader2 className="animate-spin text-highlight" size={32} />
            </div>
        );
    }

    if (!playlist) {
        return <div className="p-10 text-center text-foreground/50 bg-background">Playlist not found</div>;
    }

    const hasTracks = tracks.length > 0;
    const showGrid = tracks.length >= 4;

    return (
        <div className="flex bg-background text-foreground">

            <main className="flex-1 p-6 md:p-10 min-w-0 pb-32">

                <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
                    <div className="w-48 h-48 md:w-56 md:h-56 shrink-0 bg-card border border-foreground/10 shadow-2xl overflow-hidden rounded-md">
                        {!hasTracks ? (
                            <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                                <Music size={48} className="text-foreground/20" />
                            </div>
                        ) : showGrid ? (
                            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                {tracks.slice(0, 4).map((t, i) => (
                                    <img key={i} src={t?.coverUrl} className="w-full h-full object-cover" alt="" />
                                ))}
                            </div>
                        ) : (
                            <img src={tracks[0]?.coverUrl} className="w-full h-full object-cover" alt="" />
                        )}
                    </div>

                    <div className="flex flex-col gap-2 pb-2 flex-1 min-w-0">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground truncate">{playlist.name}</h1>
                        <p className="text-sm font-medium text-foreground/50 max-w-2xl mt-2 line-clamp-2">
                            A curated collection of tracks saved to your library.
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground/70 mt-2">
                            <span className="text-foreground">{user?.name || "You"}</span>
                            <span className="text-foreground/40">•</span>
                            <span>{tracks.length} songs, {totalDurationStr}</span>
                            <span className="text-foreground/40">•</span>
                            <span className="text-foreground/50 font-medium">Updated just now</span>
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
                            <Play size={20} fill="currentColor" className="mr-1" /> Play
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-10 text-foreground/50 hover:text-foreground hover:bg-foreground/10"
                        >
                            <Shuffle size={18} />
                        </Button>
                    </ButtonGroup>

                    <ButtonGroup separator={true}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground hover:bg-foreground/10">
                                    <ListFilter size={16} className="mr-2" />
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
                            className="w-10 text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                        >
                            {sortOrder === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
                        </Button>
                    </ButtonGroup>
                </div>

                {!hasTracks ? (
                    <div className="py-20 text-center border-t border-foreground/10">
                        <Music className="mx-auto mb-4 text-foreground/30" size={48} />
                        <p className="font-bold text-foreground/80">This playlist is empty.</p>
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
                                        playlistId={playlistId}
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