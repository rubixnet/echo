"use client";

import { use, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { useAudioEngine } from "@/components/AudioProvider"
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback"
import { Play, Pause, Music, Loader2, ArrowLeft, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useUser } from "@/hooks/useUser"
import { tooltip } from "@/components/ui/tooltip"
import { Trash2 } from "lucide-react"

export default function PlaylistPage({
    params
}: {
    params: Promise<{ id: string }>
}) {

    const resolvedParams = use(params)
    
    const user = useUser()
    const playlistId = resolvedParams.id as any

    const { currentTrackUrl, isPlaying } = useAudioEngine()
    const { playTrack } = useGlobalPlayback()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip")
    const playlist = playlists?.find((playlist) => playlist._id === playlistId)

    const removeFromPlaylist = useMutation(api.playlists.removeFromPlaylist)
    const tracks = useQuery(api.playlists.getPlaylistTracks, { playlistId });

    const handleRemoveTrack = async (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        trackId: string
    ) => {
        e.stopPropagation();
        try { 
            await removeFromPlaylist({ playlistId: playlistId as any, trackId: trackId as any })
        } catch (error) {
            console.error("Failed to remove track", error)
        }
    }

    if (playlists === undefined || tracks === undefined) {
        return (
            <div className="flex h-full items-center justify-center p-20">
                <Loader2 className="animate-spin text-emeral-500" size={32} />
            </div>
        )
    }

    if (!playlist) {
        return (
            <div className="p-10 text-center text-neutral-500"> Playlist not found </div>
        )
    }

    const hasTracks = tracks.length > 0;
    const showGrid = tracks.length >= 4

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32 text-neutral-900 animate-in fade-in duration-500">

            <Link href="/dashboard/library" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-900 transition-colors mb-8">
                <ArrowLeft size={16} /> Back to Library
            </Link>

            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

                <div className="w-full lg:w-[320px] shrink-0">
                    <div className="sticky top-10 space-y-6">

                        <div className="relative aspect-square w-full sm:w-[280px] lg:w-full mx-auto rounded-3xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shadow-xl">
                            {!hasTracks ? (
                                <div className="w-full h-full flex items-center justify-center bg-neutral-50">
                                    <Music size={64} className="text-neutral-300" />
                                </div>
                            ) : showGrid ? (
                                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                    {tracks.slice(0, 4).map((t, i) => (
                                        <img key={i} src={t?.coverUrl} className="w-full h-full object-cover" alt="Cover grid segment" />
                                    ))}
                                </div>
                            ) : (
                                <img src={tracks[0]?.coverUrl} className="w-full h-full object-cover" alt="Playlist cover" />
                            )}
                        </div>

                        <div className="text-center lg:text-left">
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-950 mb-2">{playlist.name}</h1>
                            <p className="text-sm font-medium text-neutral-500">
                                Created by <span className="text-neutral-900 font-bold">{user?.name?.split(' ')[0] || "You"}</span>
                            </p>
                            <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-widest">
                                {tracks.length} Track{tracks.length !== 1 && 's'}
                            </p>
                        </div>

                        {hasTracks && (
                            <button
                                onClick={() => playTrack({ ...tracks[0], youtubeId: tracks[0].audioUrl?.split("id=")[1] || tracks[0].youtubeId }, setLoadingId)}
                                className="w-full h-14 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20"
                            >
                                <Play size={20} fill="currentColor" /> Play All
                            </button>
                        )}
                    </div>
                </div>
                        
                <div className="flex-1 min-w-0">
                    {!hasTracks ? (
                        <div className="py-20 text-center border border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
                            <Music className="mx-auto mb-4 text-neutral-300" size={48} />
                            <p className="font-bold text-neutral-600">This playlist is empty.</p>
                            <p className="text-sm font-medium text-neutral-400 mt-1">Add songs using the Global Vault.</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="hidden sm:grid grid-cols-[16px_1fr_60px] gap-4 px-4 py-3 border-b border-neutral-100 mb-2 text-xs font-black uppercase tracking-widest text-neutral-400">
                                <span>#</span>
                                <span>Title</span>
                                <span className="flex justify-end"><Clock size={14} /></span>
                            </div>

                            {tracks.map((track, index) => {
                                if (!track) return null;
                                const videoId = track.audioUrl?.split("id=")[1] || track.youtubeId;
                                const isLoading = loadingId === videoId;
                                const isCurrent = currentTrackUrl?.includes(videoId) && isPlaying;

                                return (
                                    <div
                                        key={track._id}
                                        className="grid grid-cols-[1fr_auto] sm:grid-cols-[16px_1fr_60px] items-center gap-4 py-3 px-2 sm:px-4 -mx-2 sm:mx-0 group rounded-xl hover:bg-neutral-100/60 cursor-pointer transition-colors"
                                        onClick={() => playTrack({ ...track, youtubeId: videoId }, setLoadingId)}
                                    >
                                        <span className="hidden sm:block text-xs font-mono font-bold text-neutral-300 group-hover:text-neutral-500 text-center w-4 shrink-0">
                                            {index + 1}
                                        </span>
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-200/50 shadow-sm">
                                                <img src={track.coverUrl} className="w-full h-full object-cover" alt={track.title} />

                                                <div className={cn(
                                                    "absolute inset-0 flex items-center justify-center transition-all duration-200",
                                                    isCurrent ? "bg-black/40 opacity-100" : "bg-neutral-950/30 opacity-0 group-hover:opacity-100"
                                                )}>
                                                    {isLoading ? (
                                                        <Loader2 size={16} className="text-white animate-spin" />
                                                    ) : isCurrent ? (
                                                        <Pause size={16} className="text-white fill-white" />
                                                    ) : (
                                                        <Play size={16} className="text-white fill-white ml-0.5" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="min-w-0 pr-4">
                                                <p className={cn("text-sm font-bold truncate tracking-tight leading-snug", isCurrent ? "text-emerald-600" : "text-neutral-900")}>
                                                    {track.title}
                                                </p>
                                                <p className="text-xs font-medium text-neutral-500 truncate mt-0.5">
                                                    {track.artist}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-xs space-x-2.5 font-mono font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors text-right">
                                            {track.duration}
                                            <button onClick={(e) => handleRemoveTrack(e, track?._id)} className=" bg-neutral-50 p-1 text-neutral-400 hover:bg-neutral-100 transition-colors">
                                                <Trash2 size={16} className="text-neutral-400 hover:text-neutral-900 transition-colors" />
                                            </button>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}