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
    const [durationSec, setDurationSec] = useState(0);
    const [duration, setDuration] = useState("0:00");
    const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
    const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(0.8);
    const [activeMetadata, setActiveMetadata] = useState<TrackMetadata | null>(null);

    const isYouTube = currentTrackUrl ? (currentTrackUrl.includes("youtube.com") || currentTrackUrl.includes("youtu.be")) : false;

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!isYouTube && nativeAudioRef.current && currentTrackUrl) {
            nativeAudioRef.current.volume = volume;
            
            if (isPlaying) {
                const playPromise = nativeAudioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') console.error("Play blocked by browser:", e);
                    });
                }
            } else {
                nativeAudioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrackUrl, volume, isYouTube]);

    const handleNativeTimeUpdate = () => {
        if (!nativeAudioRef.current) return;
        const current = nativeAudioRef.current.currentTime;
        setCurrentTimeStr(formatTime(current));
        
        if (progressRef.current && durationSec > 0) {
            progressRef.current.style.width = `${(current / durationSec) * 100}%`;
        }
    };

    const handleYtProgress = (state: { playedSeconds: number, played: number }) => {
        setCurrentTimeStr(formatTime(state.playedSeconds));
        if (progressRef.current) {
            progressRef.current.style.width = `${state.played * 100}%`;
        }
    };

    const loadTrack = (url: string, metadata?: TrackMetadata) => {
        if (currentTrackUrl === url) return;
        
        setIsLoading(true);
        setCurrentTrackUrl(url);
        setActiveMetadata(metadata || null);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (!currentTrackUrl) {
            loadTrack(DEFAULT_TRACK, { title: "System Ready", artist: "Audio Engine", coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200" });
            return;
        }
        setIsPlaying(!isPlaying);
    };
    
    const setVolume = (val: number) => {
        setVolumeState(val);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));

        if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
            ytPlayerRef.current.seekTo(percent, "fraction");
        } else if (!isYouTube && nativeAudioRef.current && durationSec > 0) {
            nativeAudioRef.current.currentTime = percent * durationSec;
        }
        if (progressRef.current) progressRef.current.style.width = `${percent * 100}%`;
    };

    const getCurrentTime = () => {
        if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            return ytPlayerRef.current.getCurrentTime() || 0;
        }
        if (!isYouTube && nativeAudioRef.current) return nativeAudioRef.current.currentTime || 0;
        return 0;
    };

    const forceSync = (serverStartTime?: number, pausePosition = 0, forcePlay = false) => {
        const targetTime = forcePlay && serverStartTime ? (Date.now() - serverStartTime) / 1000 : pausePosition;
        if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
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
            progressRef, isPlaying, isLoading, currentTimeStr, duration,
            currentTrackUrl, activeMetadata, volume,
            setActiveMetadata, setIsLoading, setVolume,
            loadTrack, togglePlay, seek, getCurrentTime, forceSync
        }}>
            <div className="fixed top-[-9999px] left-[-9999px] w-[10px] h-[10px] opacity-0 pointer-events-none overflow-hidden -z-50">
                
                <audio
                    ref={nativeAudioRef}
                    src={(!isYouTube && currentTrackUrl) ? currentTrackUrl : ""}
                    preload="auto"
                    crossOrigin="anonymous"
                    onTimeUpdate={handleNativeTimeUpdate}
                    onLoadedMetadata={(e) => {
                        setDurationSec(e.currentTarget.duration);
                        setDuration(formatTime(e.currentTarget.duration));
                    }}
                    onWaiting={() => setIsLoading(true)}
                    onPlaying={() => setIsLoading(false)}
                    onCanPlay={() => setIsLoading(false)}
                    onEnded={() => setIsPlaying(false)}
                />

                <ReactPlayer
                    ref={ytPlayerRef}
                    url={(isYouTube && currentTrackUrl) ? currentTrackUrl : ""}
                    playing={isPlaying}
                    volume={volume}
                    width="10px"
                    height="10px"
                    config={{ youtube: { playerVars: { playsinline: 1, autoplay: 1 } } }}
                    onProgress={handleYtProgress}
                    onDuration={(d: number) => {
                        setDurationSec(d);
                        setDuration(formatTime(d));
                    }}
                    onReady={() => setIsLoading(false)}
                    onEnded={() => setIsPlaying(false)}
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