"use client";

import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";

const Player = ReactPlayer as any;

export interface TrackMetadata {
    id?: string;
    title: string;
    artist: string;
    coverUrl: string;
    audioUrl?: string;
}

const AudioEngineContext = createContext<any>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const ytPlayerRef = useRef<any>(null);
    const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    const [durationSec, setDurationSec] = useState(0);
    const [duration, setDuration] = useState("0:00");
    const [currentTimeSec, setCurrentTimeSec] = useState(0);
    const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
    const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(0.8);
    const [activeMetadata, setActiveMetadata] = useState<TrackMetadata | null>(null);

    const isYouTube = currentTrackUrl ? (currentTrackUrl.includes("youtube.com") || currentTrackUrl.includes("youtu.be")) : false;
    const [queue, setQueue] = useState<any[]>([])
    const [queueIndex, setQueueIndex] = useState(-1)


    const formatTime = (time: number) => {
        if (!time || isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if ("mediaSession" in navigator && activeMetadata) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: activeMetadata.title || "Unknown Track",
                artist: activeMetadata.artist || "Unknown Artist",
                album: "Broadcast Studio",
                artwork: [
                    {
                        src: activeMetadata.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=512&auto=format&fit=crop",
                        sizes: "512x512",
                        type: "image/jpeg"
                    }
                ]
            });

            navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
            navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
        }
    }, [activeMetadata]);

    useEffect(() => {
        if (!nativeAudioRef.current) return;

        if (isYouTube) {
            nativeAudioRef.current.pause();
            return;
        }

        const currentSrc = nativeAudioRef.current.getAttribute("src");
        if (currentTrackUrl && currentSrc !== currentTrackUrl) {
            nativeAudioRef.current.setAttribute("src", currentTrackUrl);
            nativeAudioRef.current.load();
        }

        nativeAudioRef.current.volume = volume;

        if (isPlaying && !isYouTube) {
            const p = nativeAudioRef.current.play();
            if (p !== undefined) p.catch(() => { });
        } else {
            nativeAudioRef.current.pause();
        }
    }, [isPlaying, currentTrackUrl, volume, isYouTube]);

    const loadTrack = (url: string, metadata?: TrackMetadata) => {
        const nextMetadata: TrackMetadata = metadata
            ? {
                ...metadata,
                audioUrl: metadata.audioUrl || url,
                coverUrl: metadata.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop",
            }
            : {
                title: "Unknown Track",
                artist: "Unknown Artist",
                coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop",
                audioUrl: url,
            };

        setActiveMetadata(nextMetadata);

        if (currentTrackUrl === url) {
            setIsPlaying(true);
            return;
        }
        setIsLoading(true);
        setIsAudioReady(false);
        setCurrentTrackUrl(url);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (!currentTrackUrl) return;
        setIsPlaying(!isPlaying);
    };

    const seekToTime = (seconds: number) => {
        if (isYouTube && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(seconds, "seconds");
        } else if (!isYouTube && nativeAudioRef.current) {
            nativeAudioRef.current.currentTime = seconds;
        }
        setCurrentTimeSec(seconds);
        setCurrentTimeStr(formatTime(seconds));
    };

    const onTrackEndRef = useRef<() => void>(() => {});

    const setOnTrackEnd = useCallback((callback: () => void) => {
        onTrackEndRef.current = callback;
    }, [])

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));

        const targetTime = percent * durationSec;
        seekToTime(targetTime);

        if (progressRef.current) progressRef.current.style.width = `${percent * 100}%`;
    };

    const getCurrentTime = () => {
        if (isYouTube && ytPlayerRef.current) return ytPlayerRef.current.getCurrentTime() || 0;
        if (!isYouTube && nativeAudioRef.current) return nativeAudioRef.current.currentTime || 0;
        return 0;
    };

    

    const forceSync = (serverStartTime?: number, pausePosition = 0, forcePlay = false) => {
        const targetTime = forcePlay && serverStartTime ? (Date.now() - serverStartTime) / 1000 : pausePosition;
        seekToTime(targetTime);
        setIsPlaying(forcePlay);
    };

    return (
        <AudioEngineContext.Provider value={{
            progressRef, isPlaying, isLoading,
            isAudioReady,
            currentTimeStr, duration,
            currentTimeSec,
            durationSec,
            currentTrackUrl, activeMetadata, volume,
            setActiveMetadata, setIsLoading, setVolume: setVolumeState,
            loadTrack, togglePlay, seek, seekToTime, getCurrentTime, forceSync, 
            queue, setQueue, queueIndex, setQueueIndex, onTrackEndRef, setOnTrackEnd
        }}>

            <audio
                ref={nativeAudioRef}
                crossOrigin="anonymous"
                onTimeUpdate={() => {
                    if (isYouTube || !nativeAudioRef.current) return;
                    const current = nativeAudioRef.current.currentTime;
                    setCurrentTimeSec(current);
                    setCurrentTimeStr(formatTime(current));
                    if (progressRef.current && durationSec > 0) progressRef.current.style.width = `${(current / durationSec) * 100}%`;
                }}
                onLoadedMetadata={(e) => {
                    if (isYouTube) return;
                    setDurationSec(e.currentTarget.duration);
                    setDuration(formatTime(e.currentTarget.duration));
                }}
                onWaiting={() => {
                    if (!isYouTube) {
                        setIsLoading(true);
                        setIsAudioReady(false);
                    }
                }}
                onPlaying={() => {
                    if (!isYouTube) {
                        setIsLoading(false);
                        setIsAudioReady(true);
                    }
                }}
                onCanPlay={() => {
                    if (!isYouTube) {
                        setIsLoading(false);
                        setIsAudioReady(true);
                    }
                }}
                onEnded={() => onTrackEndRef.current()}
                className="hidden"
            />

            <div className="fixed top-[-9999px] left-[-9999px] w-[1px] h-[1px] opacity-0 pointer-events-none -z-50">
                <Player
                    ref={ytPlayerRef}
                    url={isYouTube ? (currentTrackUrl || "") : ""}
                    playing={isYouTube && isPlaying}
                    volume={volume}
                    width="10px"
                    height="10px"
                    config={{ youtube: { playerVars: { playsinline: 1, autoplay: 1 } } }}
                    onProgress={(state: any) => {
                        if (!isYouTube) return;
                        setCurrentTimeSec(state.playedSeconds);
                        setCurrentTimeStr(formatTime(state.playedSeconds));
                        if (progressRef.current) progressRef.current.style.width = `${state.played * 100}%`;
                    }}
                    onReady={() => {
                        if (isYouTube) {
                            const duration = ytPlayerRef.current?.getDuration?.();
                            if (typeof duration === "number") {
                                setDurationSec(duration);
                                setDuration(formatTime(duration));
                            }
                            setIsLoading(false);
                            setIsAudioReady(true);
                        }
                    }}
                    onEnded={() => onTrackEndRef.current()} 
                />
            </div>

            {children}
        </AudioEngineContext.Provider>
    );
}

export const useAudioEngine = () => {
    const context = useContext(AudioEngineContext);
    if (!context) throw new Error("useAudioEngine must be used within an AudioProvider");
    return context;
};