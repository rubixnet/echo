"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player";

const DEFAULT_TRACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export interface TrackMetadata {
    id?: string;
    title: string;
    artist: string;
    coverUrl: string;
}

const AudioEngineContext = createContext<any>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const ytPlayerRef = useRef<ReactPlayer | null>(null);
    const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false); 
    
    const [durationSec, setDurationSec] = useState(0);
    const [duration, setDuration] = useState("0:00");
    const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
    const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(0.8);
    const [activeMetadata, setActiveMetadata] = useState<TrackMetadata | null>(null);

    const isYouTube = currentTrackUrl ? (currentTrackUrl.includes("youtube.com") || currentTrackUrl.includes("youtu.be")) : false;

    const formatTime = (time: number) => {
        if (!time || isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!nativeAudioRef.current) return;
        
        if (isYouTube) {
            nativeAudioRef.current.pause();
            return;
        }

        if (currentTrackUrl && nativeAudioRef.current.src !== currentTrackUrl) {
            nativeAudioRef.current.src = currentTrackUrl;
            nativeAudioRef.current.load();
        }

        nativeAudioRef.current.volume = volume;

        if (isPlaying && !isYouTube) {
            const p = nativeAudioRef.current.play();
            if (p !== undefined) p.catch(() => {});
        } else {
            nativeAudioRef.current.pause();
        }
    }, [isPlaying, currentTrackUrl, volume, isYouTube]);

    const loadTrack = (url: string, metadata?: TrackMetadata) => {
        if (currentTrackUrl === url) {
            setIsPlaying(true);
            return;
        }
        setIsLoading(true);
        setIsAudioReady(false); 
        setCurrentTrackUrl(url);
        setActiveMetadata(metadata || null);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (!currentTrackUrl) return loadTrack(DEFAULT_TRACK, { title: "System Ready", artist: "Audio Engine", coverUrl: "" });
        setIsPlaying(!isPlaying);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
        
        if (isYouTube && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(percent, "fraction");
        } else if (!isYouTube && nativeAudioRef.current && durationSec > 0) {
            nativeAudioRef.current.currentTime = percent * durationSec;
        }
        if (progressRef.current) progressRef.current.style.width = `${percent * 100}%`;
    };

    const getCurrentTime = () => {
        if (isYouTube && ytPlayerRef.current) return ytPlayerRef.current.getCurrentTime() || 0;
        if (!isYouTube && nativeAudioRef.current) return nativeAudioRef.current.currentTime || 0;
        return 0;
    };

    const forceSync = (serverStartTime?: number, pausePosition = 0, forcePlay = false) => {
        // Note: This function is largely replaced by the new isAudioReady logic in the RoomPage, 
        // but kept here for compatibility if used elsewhere.
        const targetTime = forcePlay && serverStartTime ? (Date.now() - serverStartTime) / 1000 : pausePosition;
        if (isYouTube && ytPlayerRef.current) {
            if (Math.abs((ytPlayerRef.current.getCurrentTime() || 0) - targetTime) > 0.5) {
                ytPlayerRef.current.seekTo(targetTime, "seconds");
            }
        } else if (!isYouTube && nativeAudioRef.current) {
            if (Math.abs(nativeAudioRef.current.currentTime - targetTime) > 0.5) {
                nativeAudioRef.current.currentTime = targetTime;
            }
        }
        setIsPlaying(forcePlay);
    };

    return (
        <AudioEngineContext.Provider value={{
            progressRef, isPlaying, isLoading, 
            isAudioReady, // 🔥 Expose the new flag
            currentTimeStr, duration,
            currentTrackUrl, activeMetadata, volume,
            setActiveMetadata, setIsLoading, setVolume: setVolumeState,
            loadTrack, togglePlay, seek, getCurrentTime, forceSync
        }}>
            
            <audio
                ref={nativeAudioRef}
                crossOrigin="anonymous"
                onTimeUpdate={() => {
                    if (isYouTube || !nativeAudioRef.current) return;
                    const current = nativeAudioRef.current.currentTime;
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
                        setIsAudioReady(false); // 🔥 Buffering...
                    }
                }}
                onPlaying={() => { 
                    if (!isYouTube) {
                        setIsLoading(false); 
                        setIsAudioReady(true); // 🔥 Ready!
                    }
                }}
                onCanPlay={() => { 
                    if (!isYouTube) {
                        setIsLoading(false); 
                        setIsAudioReady(true); // 🔥 Ready!
                    }
                }}
                onEnded={() => { if (!isYouTube) setIsPlaying(false); }}
                className="hidden"
            />

            <div className="fixed top-[-9999px] left-[-9999px] w-[1px] h-[1px] opacity-0 pointer-events-none -z-50">
                <ReactPlayer
                    ref={ytPlayerRef}
                    url={isYouTube ? (currentTrackUrl || "") : ""}
                    playing={isYouTube && isPlaying}
                    volume={volume}
                    width="10px"
                    height="10px"
                    config={{ youtube: { playerVars: { playsinline: 1, autoplay: 1 } } as any }}
                    onProgress={((state: any) => {
                        if (!isYouTube) return;
                        setCurrentTimeStr(formatTime(state.playedSeconds));
                        if (progressRef.current) progressRef.current.style.width = `${state.played * 100}%`;
                    }) as any}
                    onDuration={((d: number) => {
                        if (!isYouTube) return;
                        setDurationSec(d);
                        setDuration(formatTime(d));
                    }) as any}
                    onReady={() => { 
                        if (isYouTube) {
                            setIsLoading(false); 
                            setIsAudioReady(true); 
                        }
                    }}
                    onEnded={() => { if (isYouTube) setIsPlaying(false); }}
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