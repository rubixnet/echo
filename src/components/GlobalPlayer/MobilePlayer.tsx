"use client";

import { useState } from "react";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, ChevronDown, Loader2, Music, ListMusic, EllipsisVertical, Mic2, ListPlus } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidGlassCard";
import { Timeline, PlaybackControls, LikeButton, useNextInQueue, PlaybackStatus, useDominantColor, VibrantBackground } from "./Shared";
import { SyncedLyrics } from "@/components/SyncedLyrics";
import { cn } from "@/lib/utils";
import { Track } from "../TrackComponent";

export function MobilePlayer({ setIsPlaylistModalOpen }: { setIsPlaylistModalOpen: (v: boolean) => void }) {
    const { activeMetadata, isPlaying, isLoading, togglePlay, currentTimeSec, seekToTime, durationSec } = useAudioEngine();

    const [isExpanded, setIsExpanded] = useState(false);
    const [mobileTab, setMobileTab] = useState<'cover' | 'lyrics' | 'queue'>('cover');
    const progressPercent = durationSec ? (currentTimeSec / durationSec) * 100 : 0;
    const { upNextTracks, isFetching } = useNextInQueue(4);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const rgb = useDominantColor(activeMetadata?.coverUrl);
    const dominantColor = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.6)` : 'transparent';
    
    if (!isExpanded) {
        return (
            <div
                className="fixed bottom-[80px] left-3 right-3 z-[999] cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => activeMetadata && setIsExpanded(true)}
            >
                <div
                    className="absolute top-4 -bottom-15 -left-4 -right-4 -z-10 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ease-out"
                    style={{ backgroundColor: dominantColor }}
                />

                <LiquidContainer radius="16px" className={cn("w-full h-[56px] relative z-10")}>
                    <div
                        className="h-full bg-foreground/5 absolute inset-0 rounded-[16px] transition-all duration-75"
                        style={
                            activeMetadata
                                ? { width: progressPercent > 7 ? `${progressPercent}%` : "6%" }
                                : { width: 0 }
                        }
                    />
                    <div className="w-full h-full flex items-center px-3 z-11 gap-3">
                        {activeMetadata ? (
                            <>
                                <div className="w-10 h-10 rounded-md overflow-hidden shrink-0">
                                    <img src={activeMetadata.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="text-xs font-bold text-foreground truncate">{activeMetadata.title}</h4>
                                    <p className="text-[10px] font-medium text-foreground/50 truncate">{activeMetadata.artist}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                    className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-foreground/5 rounded-full transition-colors shrink-0"
                                >
                                    {isLoading ? <Loader2 size={20} className="animate-spin" strokeWidth={2.5} /> : isPlaying ? <Pause size={20} fill="currentColor" strokeWidth={1} /> : <Play size={20} fill="currentColor" strokeWidth={1} />}
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 text-foreground/50 w-full">
                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                    <Music size={18} strokeWidth={2} />
                                </div>
                                <h4 className="text-xs font-medium">Ready to play</h4>
                            </div>
                        )}
                    </div>
                </LiquidContainer>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">

            <VibrantBackground imageUrl={activeMetadata?.coverUrl} />

            <div className="flex items-center justify-between p-6 relative z-10 shrink-0">
                <button onClick={() => setIsExpanded(false)} className="p-2 text-foreground/60 hover:text-foreground rounded-full transition-colors">
                    <ChevronDown size={28} strokeWidth={2} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                    {mobileTab === 'lyrics' ? 'Lyrics' : 'Now Playing'}
                </span>
                <div className="w-11" />
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative z-10 px-6">
                {mobileTab === 'cover' && (
                    <div className="flex-1 flex items-center justify-center px-2">
                        <div className="w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl">
                            <img src={activeMetadata?.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                        </div>
                    </div>
                )}
                {mobileTab === 'lyrics' && (
                    <div className="flex-1 overflow-hidden flex flex-col w-full relative">
                        {activeMetadata && (
                            <SyncedLyrics
                                activeMetadata={activeMetadata}
                                currentTimeSec={currentTimeSec}
                                seekToTime={seekToTime}
                            />
                        )}
                    </div>
                )}
                {mobileTab === 'queue' && (
                    <div className="flex-1 flex flex-col max-w-xl  w-full h-full overflow-hidden">
                        <PlaybackStatus isFetching={isFetching} />

                        <h3 className="text-[12px] font-medium text-foreground/50 tracking-wide mb-2 mt-5 shrink-0 px-1 ">Playing Next</h3>

                        <div className="flex-1 liquid-scroll px-1 space-y-0.5">
                            {upNextTracks.map((track: any, idx: number) => (
                                <Track
                                    key={track.id || track._id || `queue-${idx}`}
                                    track={track}
                                    variant="row"
                                    loadingId={loadingId}
                                    setLoadingId={setLoadingId}
                                    showDuration={false}
                                />
                            ))}

                            {isFetching && (
                                <div className="flex items-center justify-center p-6 text-foreground/40 gap-2">
                                    <Loader2 className="animate-spin" size={14} />
                                    <span className="text-xs font-medium">Finding similar tracks...</span>
                                </div>
                            )}

                            {!isFetching && upNextTracks.length === 0 && (
                                <div className="flex items-center justify-center p-6 text-foreground/40">
                                    <span className="text-xs font-medium">End of queue</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>



            <div className="px-6 pb-12 pt-6 relative z-10 shrink-0 flex flex-col">

                <div className="flex flex-col items-center justify-center mb-6 w-full px-4 text-center">
                    <h2 className="text-xl font-bold text-foreground truncate w-full tracking-tight mb-0.5">{activeMetadata?.title}</h2>
                    <p className="text-sm font-medium text-foreground/50 truncate w-full">{activeMetadata?.artist}</p>
                </div>

                <div className="flex items-center justify-between w-full mb-6 px-2">

                    <LiquidContainer radius="999px">
                        <button
                            onClick={() => setMobileTab(prev => prev === 'cover' ? 'lyrics' : 'cover')}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center transition-colors",
                                mobileTab === 'lyrics' ? "text-primary" : "text-foreground/70 hover:text-foreground"
                            )}
                        >
                            <Mic2 size={18} strokeWidth={2} />
                        </button>
                    </LiquidContainer>

                    <LiquidContainer radius="999px">
                        <div className="flex items-center h-10 px-1.5 gap-1">
                            <div className="w-8 h-8 flex items-center justify-center">
                                <LikeButton className="p-0" />
                            </div>
                            <button
                                onClick={() => setIsPlaylistModalOpen(true)}
                                className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors"
                            >
                                <ListPlus size={18} strokeWidth={2.5} />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center text-foreground/60 hover:text-foreground transition-colors">
                                <EllipsisVertical size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </LiquidContainer>

                    <LiquidContainer radius="999px">
                        <button className="w-10 h-10 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
                            onClick={() => setMobileTab(prev => prev === 'cover' ? 'queue' : 'cover')}>
                            <ListMusic size={18} strokeWidth={2} />
                        </button>
                    </LiquidContainer>
                </div>

                <Timeline className="mb-8" />
                <PlaybackControls iconSize={36} className="justify-between px-2" />

            </div>
        </div>
    );
}