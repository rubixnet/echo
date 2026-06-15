"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import ReactPlayer from "react-player";

const DEFAULT_TRACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export interface TrackMetadata {
    title: string;
    artist: string;
    coverUrl: string;
}

const AudioEngineContext = createContext<any>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const playerRef = useRef<ReactPlayer | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 
    const [durationSec, setDurationSec] = useState(0);
    const [duration, setDuration] = useState("0:00");
    const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
    const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(0.8);
    const [activeMetadata, setActiveMetadata] = useState<TrackMetadata | null>(null);

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleProgress = (state: { playedSeconds: number, played: number }) => {
        setCurrentTimeStr(formatTime(state.playedSeconds));
        if (progressRef.current) {
            progressRef.current.style.width = `${state.played * 100}%`;
        }
    };

    const handleDuration = (duration: number) => {
        setDurationSec(duration);
        setDuration(formatTime(duration));
    };

    const setVolume = (val: number) => {
        setVolumeState(val);
    };

    const loadTrack = (url: string, metadata?: TrackMetadata) => {
        if (currentTrackUrl === url) return;
        setIsLoading(true);
        setCurrentTrackUrl(url);
        setIsPlaying(true); 
        
        if (metadata) {
            setActiveMetadata(metadata);
        }
    };

    const togglePlay = () => {
        if (!currentTrackUrl) {
            loadTrack(DEFAULT_TRACK, { 
                title: "System Ready", 
                artist: "Audio Engine", 
                coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200" 
            });
            return;
        }
        setIsPlaying(!isPlaying);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!playerRef.current || durationSec === 0) return;
        
        const bounds = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - bounds.left;
        const clickPositionPercent = Math.max(0, Math.min(1, clickX / bounds.width));

        // ReactPlayer allows seeking by fraction (0 to 1)
        playerRef.current.seekTo(clickPositionPercent, "fraction");
        
        if (progressRef.current) {
            progressRef.current.style.width = `${clickPositionPercent * 100}%`;
        }
    };

    const getCurrentTime = () => {
        return playerRef.current ? playerRef.current.getCurrentTime() : 0;
    };

    const forceSync = (serverStartTime?: number, pausePosition = 0, forcePlay = false) => {
        if (!playerRef.current) return;
        
        if (forcePlay && serverStartTime) {
            const timeRunning = Date.now() - serverStartTime;
            const targetTime = timeRunning / 1000;
            
            if (Math.abs(getCurrentTime() - targetTime) > 0.5) {
                playerRef.current.seekTo(targetTime, "seconds");
            }
            setIsPlaying(true);
        } else {
            playerRef.current.seekTo(pausePosition, "seconds");
            setIsPlaying(false);
        }
    };

    return (
        <AudioEngineContext.Provider value={{
            progressRef,
            isPlaying,
            isLoading, 
            currentTimeStr,
            duration,
            currentTrackUrl,
            activeMetadata,
            volume,
            setActiveMetadata,
            setIsLoading,
            setVolume,
            loadTrack,
            togglePlay,
            seek,
            getCurrentTime,
            forceSync
        }}>
            <div className="hidden">
                <ReactPlayer
                    ref={playerRef}
                    url={currentTrackUrl || ""}
                    playing={isPlaying}
                    volume={volume}
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onBuffer={() => setIsLoading(true)}
                    onBufferEnd={() => setIsLoading(false)}
                    onReady={() => setIsLoading(false)}
                    onError={(e) => {
                        console.error("Player Error:", e);
                        setIsLoading(false);
                        setIsPlaying(false);
                    }}
                    width="0"
                    height="0"
                    config={{
                        youtube: { playerVars: { origin: typeof window !== 'undefined' ? window.location.origin : '' } }
                    }}
                />
            </div>
            {children}
        </AudioEngineContext.Provider>
    );
}

export function useAudioEngine() {
    const context = useContext(AudioEngineContext);
    if (!context) {
        throw new Error("useAudioEngine must be used within an AudioProvider");
    }
    return context;
}