"use client";

import { useState, useRef, useEffect } from "react";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import {
    Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Heart,
    Loader2, Music, EllipsisVertical, ListMusic, Mic2, Shuffle, MonitorSpeaker,
    Maximize2, Minimize2, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";

import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { SyncedLyrics } from "@/components/SyncedLyrics";

type TabView = 'cover' | 'lyrics' | 'artist' | 'queue';

export default function GlobalPlayer({ user }: { user?: any }) {
    const {
        isPlaying, isLoading, togglePlay, activeMetadata,
        currentTimeSec, durationSec, duration, currentTimeStr,
        seekToTime, volume, setVolume, setOnTrackEnd, queue, queueIndex,
        isOnLoop, setIsOnLoop
    } = useAudioEngine();

    const { playNext, playPrevious } = useGlobalPlayback();
    const playNextRef = useRef(playNext);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDrawerFullscreen, setIsDrawerFullscreen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabView>('cover');

    const [drawerWidth, setDrawerWidth] = useState(420);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 320 && newWidth < window.innerWidth - 100) {
                setDrawerWidth(newWidth);
            }
        };
        const handleMouseUp = () => setIsResizing(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        playNextRef.current = playNext;
    }, [playNext]);

    useEffect(() => {
        if (setOnTrackEnd) {
            setOnTrackEnd(() => playNextRef.current(true));
        }
    }, [setOnTrackEnd]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

    useEffect(() => {
        if ('mediaSession' in navigator && activeMetadata) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: activeMetadata.title,
                artist: activeMetadata.artist,
                artwork: [{ src: activeMetadata.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
            });

            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
            navigator.mediaSession.setActionHandler('nexttrack', () => playNext(false));
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) seekToTime(details.seekTime);
            });
        }
    }, [activeMetadata, togglePlay, playNext, playPrevious, seekToTime]);

    const [isDragging, setIsDragging] = useState(false);
    const [dragValue, setDragValue] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVolumeExpanded, setIsVolumeExpanded] = useState(false);
    const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const userId = user?._id;
    const likedSongs = useQuery(api.likes.getMyLikes, userId ? { userId } : "skip");
    const isLiked = Boolean(activeMetadata?.id && likedSongs?.some((song: any) => song.trackId === activeMetadata.id));
    const toggleLikeMutation = useMutation(api.likes.toggleLike);

    const handleLike = async () => {
        if (!activeMetadata?.id || !userId) return;
        try {
            await toggleLikeMutation({ userId: userId as any, trackId: activeMetadata.id as any });
        } catch (error) {
            console.error(error);
        }
    };

    const progressPercent = durationSec ? ((isDragging ? dragValue : currentTimeSec) / durationSec) * 100 : 0;
    const currentDragStr = isDragging
        ? `${Math.floor(dragValue / 60)}:${Math.floor(dragValue % 60).toString().padStart(2, '0')}`
        : currentTimeStr;

    return (
        <>
            <div
                style={{ width: isDrawerFullscreen ? '100vw' : `${drawerWidth}px` }}
                className={cn(
                    "fixed top-0 right-0 h-full bg-background z-[1000] flex flex-col overflow-hidden shadow-2xl",
                    isDrawerOpen ? "translate-x-0" : "translate-x-full",
                    !isResizing && "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                )}
            >
                {activeMetadata && (
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-background">
                        <img
                            src={activeMetadata.coverUrl}
                            alt=""
                            className="w-full h-full object-cover blur-[100px] opacity-40 scale-150 saturate-200"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/95" />
                    </div>
                )}

                {!isDrawerFullscreen && (
                    <div
                        onMouseDown={() => setIsResizing(true)}
                        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize hover:bg-foreground/10 active:bg-foreground/20 z-[1001] transition-colors"
                    />
                )}

                <div className="flex items-center justify-between p-4 shrink-0 relative z-10">
                    <div className="flex-1 flex justify-start">
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
                        >
                            <ChevronDown size={24} className="rotate-90" />
                        </button>
                    </div>

                    <LiquidContainer radius="999px" className="flex items-center p-1 gap-1">
                        {(['cover', 'lyrics', 'queue'] as TabView[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors",
                                    activeTab === tab
                                        ? "backdrop-blur-md bg-primary/5 text-foreground"
                                        : "bg-transparent text-foreground/60 hover:text-foreground"
                                )}

                            >
                                {tab}
                            </button>
                        ))}
                    </LiquidContainer>

                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={() => setIsDrawerFullscreen(!isDrawerFullscreen)}
                            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
                        >
                            {isDrawerFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative z-10 overflow-hidden flex flex-col px-6">
                    {activeMetadata ? (
                        <>
                            {activeTab === 'cover' && (
                                <div className="flex-1 flex items-center justify-center p-4">
                                    <div className="w-full max-w-[65vh] aspect-square rounded-2xl shadow-2xl overflow-hidden shrink-0">
                                        <img src={activeMetadata.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'lyrics' && (
                                <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full relative">
                                    <SyncedLyrics
                                        activeMetadata={activeMetadata}
                                        currentTimeSec={currentTimeSec}
                                        seekToTime={seekToTime}
                                    />
                                </div>
                            )}


                            {activeTab === 'queue' && (
                                <div className="flex-1 flex items-center justify-center text-foreground/50 font-medium">
                                    Queue Feature Coming Soon
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-foreground/40 gap-4">
                            <Music size={48} />
                            <p className="font-medium">No active track</p>
                        </div>
                    )}
                </div>

                {activeMetadata && (
                    <div className={cn("p-6 md:p-8 pt-2 shrink-0 relative z-10 flex flex-col", isDrawerFullscreen ? "max-w-4xl w-full mx-auto" : "")}>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col min-w-0 pr-4">
                                <h2 className="text-2xl md:text-3xl font-black text-foreground truncate">{activeMetadata.title}</h2>
                                <p className="text-sm md:text-base font-medium text-foreground/60 truncate">{activeMetadata.artist}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-foreground/70">
                                <button onClick={handleLike} className="p-2 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors">
                                    <Heart size={24} strokeWidth={2} className={cn(isLiked && "text-emerald-500 fill-emerald-500")} />
                                </button>
                                <button className="p-2 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors">
                                    <ListMusic size={24} strokeWidth={2} />
                                </button>
                                <button className="p-2 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors">
                                    <EllipsisVertical size={24} strokeWidth={2} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full mb-6 group/timeline">
                            <span className="text-xs font-bold text-foreground/50 tabular-nums min-w-[36px]">{currentDragStr}</span>
                            <div className="relative flex-1 flex items-center h-2 cursor-pointer">
                                <input
                                    type="range" min={0} max={durationSec || 100}
                                    value={isDragging ? dragValue : currentTimeSec}
                                    onMouseDown={() => setIsDragging(true)}
                                    onChange={(e) => setDragValue(Number(e.target.value))}
                                    onMouseUp={(e) => {
                                        setIsDragging(false);
                                        seekToTime(Number(e.currentTarget.value));
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0"
                                />
                                <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden group-hover/timeline:h-2 transition-all">
                                    <div className="h-full bg-foreground rounded-full transition-all duration-75 relative" style={{ width: `${progressPercent}%` }} />
                                </div>
                            </div>
                            <span className="text-xs font-bold text-foreground/50 tabular-nums min-w-[36px] text-right">{duration}</span>
                        </div>

                        <div className="flex items-center justify-center gap-6 md:gap-8">
                            <button className="text-foreground/40 hover:text-foreground transition-colors"><Shuffle size={20} strokeWidth={2} /></button>
                            <button onClick={playPrevious} disabled={!queue || queueIndex <= 0 && currentTimeSec <= 3} className="text-foreground/80 hover:text-foreground active:scale-95 transition-transform disabled:opacity-30">
                                <SkipBack size={28} fill="currentColor" strokeWidth={1} />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="w-16 h-16 flex items-center justify-center bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-transform shadow-xl"
                            >
                                {isLoading ? (
                                    <Loader2 size={28} className="animate-spin text-background" strokeWidth={3} />
                                ) : isPlaying ? (
                                    <Pause size={28} fill="currentColor" strokeWidth={1} />
                                ) : (
                                    <Play size={28} fill="currentColor" strokeWidth={1} className="ml-1" />
                                )}
                            </button>
                            <button onClick={() => playNext(false)} disabled={!activeMetadata} className="text-foreground/80 hover:text-foreground active:scale-95 transition-transform disabled:opacity-30">
                                <SkipForward size={28} fill="currentColor" strokeWidth={1} />
                            </button>
                            <button onClick={() => setIsOnLoop(!isOnLoop)} className={cn("transition-colors", isOnLoop ? "text-emerald-500" : "text-foreground/40 hover:text-foreground")}><Repeat size={20} strokeWidth={2} /></button>
                        </div>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-[997] transition-opacity duration-300",
                    isDrawerOpen ? "opacity-0" : "opacity-100"
                )}
            />

            <div
                className={cn(
                    "fixed bottom-3 px-1 left-1/2 -translate-x-1/2 w-[98%] max-w-[1000px] z-[999] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isDrawerOpen ? "translate-y-[150%]" : "translate-y-0"
                )}
            >
                <LiquidContainer radius="16px" className="w-full h-[50px] shadow-xl">
                    <div className="w-full h-full flex items-center px-4">

                        <div className="flex-[1.5] basis-0 flex items-center gap-3 min-w-0 pr-6">
                            {activeMetadata ? (
                                <>
                                    <button
                                        onClick={() => setIsDrawerOpen(true)}
                                        className="relative group/cover w-8 h-8 rounded-md overflow-hidden shrink-0 shadow-sm cursor-pointer"
                                    >
                                        <img
                                            src={activeMetadata.coverUrl}
                                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop" }}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform group-hover/cover:scale-105 group-hover/cover:opacity-50"
                                        />
                                    </button>


                                    <div className="flex flex-col flex-1 min-w-0 justify-center gap-[2px]">
                                        <div className="md:flex items-baseline truncate">
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground truncate cursor-pointer hover:underline" onClick={() => setIsDrawerOpen(true)}>
                                                {activeMetadata.title}
                                            </h4>
                                            <span className="text-[10px] font-medium text-foreground/50 md:ml-2  truncate shrink-0">

                                                <span className="hidden md:inline">
                                                    •

                                                </span>

                                                {activeMetadata.artist}</span>
                                        </div>

                                        <div className="md:flex hidden items-center gap-2 w-full group/timeline">
                                            <span className="text-[9px] font-medium text-foreground/50 tabular-nums min-w-[28px]">{currentDragStr}</span>
                                            <div className="relative flex-1 flex items-center h-1.5 cursor-pointer">
                                                <input
                                                    type="range" min={0} max={durationSec || 100}
                                                    value={isDragging ? dragValue : currentTimeSec}
                                                    onMouseDown={() => setIsDragging(true)}
                                                    onChange={(e) => setDragValue(Number(e.target.value))}
                                                    onMouseUp={(e) => {
                                                        setIsDragging(false);
                                                        seekToTime(Number(e.currentTarget.value));
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 m-0"
                                                />
                                                <div className="w-full h-1 bg-foreground/10 rounded-full overflow-hidden group-hover/timeline:h-1.5 transition-all">
                                                    <div className="h-full bg-foreground rounded-full transition-all duration-75" style={{ width: `${progressPercent}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-medium text-foreground/50 tabular-nums min-w-[28px]">{duration}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4 text-foreground/50">
                                    <div className="w-8 h-8 bg-foreground/10 rounded flex items-center justify-center shrink-0">
                                        <Music size={16} className="text-foreground/40" />
                                    </div>


                                    <div className="flex items-baseline truncate">
                                        <h4 className="text-xs text-foreground/60">Ready to play</h4>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex md:flex-1 basis-0 flex items-center md:justify-center justify-end gap-4">
                            <button disabled={!activeMetadata} className="text-foreground/40 hover:text-foreground hidden md:flex transition-colors disabled:opacity-50"><Shuffle size={20} strokeWidth={2} /></button>
                            <button onClick={playPrevious} disabled={!queue || queueIndex <= 0 && currentTimeSec <= 3} className="text-foreground/70 hidden md:flex hover:text-foreground active:scale-95 transition-all disabled:opacity-30"><SkipBack size={24} fill="currentColor" strokeWidth={1} /></button>
                            <button onClick={togglePlay} disabled={!activeMetadata} className="text-foreground hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                {isLoading ? <Loader2 size={28} className="animate-spin" strokeWidth={2.5} /> : isPlaying ? <Pause size={28} fill="currentColor" strokeWidth={1} /> : <Play size={28} fill="currentColor" strokeWidth={1} />}
                            </button>
                            <button onClick={() => playNext(false)} disabled={!activeMetadata} className="hidden md:flex text-foreground/70 hover:text-foreground active:scale-95 transition-all disabled:opacity-30"><SkipForward size={24} fill="currentColor" strokeWidth={1} /></button>
                            <button onClick={() => setIsOnLoop(!isOnLoop)} disabled={!activeMetadata} className={cn("transition-colors hidden md:flex disabled:opacity-50 shrink-0", isOnLoop ? "text-emerald-500" : "text-foreground/40 hover:text-foreground")}><Repeat size={20} strokeWidth={2} /></button>
                        </div>

                        <div className="md:flex-[1.5] hidden basis-0 md:flex items-center justify-end gap-3 min-w-0 pl-8">
                            <button onClick={handleLike} disabled={!activeMetadata} className="transition-colors disabled:opacity-50 shrink-0">
                                <Heart size={20} strokeWidth={2} className={cn("transition-colors", isLiked ? "text-emerald-500 fill-emerald-500" : "text-foreground/70 hover:text-foreground")} />
                            </button>

                            <button
                                onClick={() => {
                                    if (activeTab === 'lyrics' && isDrawerOpen) {
                                        setIsDrawerOpen(false);
                                    } else {
                                        setActiveTab('lyrics');
                                        setIsDrawerOpen(true);
                                    }
                                }}
                                disabled={!activeMetadata}
                                className={cn("transition-colors disabled:opacity-50 shrink-0", activeTab === 'lyrics' && isDrawerOpen ? "text-primary" : "text-foreground/70 hover:text-foreground")}
                            >
                                <Mic2 size={20} strokeWidth={2} />
                            </button>

                            <button disabled={!activeMetadata} className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50 shrink-0"><ListMusic size={20} strokeWidth={2} /></button>
                            <button disabled={!activeMetadata} className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50 shrink-0"><MonitorSpeaker size={20} strokeWidth={2} /></button>
                            <div className="flex items-center gap-2 shrink-0 group/volume" onMouseEnter={() => setIsVolumeExpanded(true)} onMouseLeave={() => setIsVolumeExpanded(false)}>
                                <button onClick={() => setVolume && setVolume(volume === 0 ? 0.8 : 0)} className="text-foreground/70 group-hover/volume:text-foreground transition-colors shrink-0">
                                    {volume === 0 ? <VolumeX size={20} strokeWidth={2} /> : <Volume2 size={20} strokeWidth={2} />}
                                </button>
                                <div className={cn("transition-all duration-300 overflow-hidden flex items-center origin-left", isVolumeExpanded ? "w-20 opacity-100" : "w-0 opacity-0")}>
                                    <input type="range" min="0" max="1" step="0.01" value={volume !== undefined ? volume : 0.8} onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))} className="w-full h-1 bg-foreground/20 rounded-full appearance-none cursor-pointer accent-foreground" />
                                </div>
                            </div>
                            <div className="relative shrink-0" ref={menuRef}>
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} disabled={!activeMetadata} className="text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50"><EllipsisVertical size={20} strokeWidth={2} /></button>
                                {isMenuOpen && (
                                    <LiquidContainer radius="16px" className="absolute bottom-full right-0 mb-4 w-48 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">
                                        <button onClick={() => { setIsMenuOpen(false); setIsPlaylistModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-foreground hover:bg-foreground/5 transition-colors rounded-[16px]">
                                            <ListMusic size={18} className="text-foreground/60" /> Add to Playlist
                                        </button>
                                    </LiquidContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </LiquidContainer>
            </div>

            <AddToPlaylistModal isOpen={isPlaylistModalOpen} onClose={() => setIsPlaylistModalOpen(false)} trackId={activeMetadata?.id || null} />
        </>
    );


}