"use client";

import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import ReactPlayer from "react-player/youtube";

const DEFAULT_TRACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export interface TrackMetadata {
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

    const isYouTube = currentTrackUrl?.includes("youtube.com") || currentTrackUrl?.includes("youtu.be");
    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        nativeAudioRef.current = new Audio();
        nativeAudioRef.current.crossOrigin = "anonymous";
        const audio = nativeAudioRef.current;
        let animationFrame: number;

        const updateTime = () => {
            setCurrentTimeStr(formatTime(audio.currentTime));
            if (progressRef.current && audio.duration) {
                progressRef.current.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
            }
            animationFrame = requestAnimationFrame(updateTime);
        };

        audio.addEventListener("play", () => { setIsPlaying(true); updateTime(); });
        audio.addEventListener("pause", () => { setIsPlaying(false); cancelAnimationFrame(animationFrame); });
        audio.addEventListener("loadedmetadata", () => {
            setDurationSec(audio.duration);
            setDuration(formatTime(audio.duration));
        });
        audio.addEventListener("waiting", () => setIsLoading(true));
        audio.addEventListener("playing", () => setIsLoading(false));

        return () => {
            audio.pause();
            cancelAnimationFrame(animationFrame);
        };
    }, []);

    useEffect(() => {
        if (!currentTrackUrl || !nativeAudioRef.current) return;

        if (isYouTube) {
            nativeAudioRef.current.pause();
        } else {
            setIsLoading(true);
            nativeAudioRef.current.src = currentTrackUrl;
            nativeAudioRef.current.volume = volume;
            nativeAudioRef.current.load();
            nativeAudioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(e => console.log("Autoplay blocked:", e));
        }
    }, [currentTrackUrl]);


    const setVolume = (val: number) => {
        setVolumeState(val);
        if (nativeAudioRef.current && !isYouTube) {
            nativeAudioRef.current.volume = val;
        }
    };

    const loadTrack = (url: string, metadata?: TrackMetadata) => {
        if (currentTrackUrl === url) return;
        setCurrentTrackUrl(url);
        setIsPlaying(true);
        if (metadata) setActiveMetadata(metadata);
    };

    const togglePlay = () => {
        if (!currentTrackUrl) {
            loadTrack(DEFAULT_TRACK, { title: "System Ready", artist: "Audio Engine", coverUrl: "" });
            return;
        }

        if (isYouTube) {
            setIsPlaying(!isPlaying);
        } else if (nativeAudioRef.current) {
            if (isPlaying) nativeAudioRef.current.pause();
            else nativeAudioRef.current.play();
        }
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
        if (isYouTube && ytPlayerRef.current) return ytPlayerRef.current.getCurrentTime();
        if (!isYouTube && nativeAudioRef.current) return nativeAudioRef.current.currentTime;
        return 0;
    };

    const forceSync = (serverStartTime?: number, pausePosition = 0, forcePlay = false) => {
        const targetTime = forcePlay && serverStartTime ? (Date.now() - serverStartTime) / 1000 : pausePosition;

        if (isYouTube && ytPlayerRef.current) {
            if (Math.abs(ytPlayerRef.current.getCurrentTime() - targetTime) > 0.5) {
                ytPlayerRef.current.seekTo(targetTime, "seconds");
            }
            setIsPlaying(forcePlay);
        } else if (!isYouTube && nativeAudioRef.current) {
            if (Math.abs(nativeAudioRef.current.currentTime - targetTime) > 0.5) {
                nativeAudioRef.current.currentTime = targetTime;
            }
            if (forcePlay) nativeAudioRef.current.play().catch(e => console.log(e));
            else nativeAudioRef.current.pause();
        }
    };

    return (
        <AudioEngineContext.Provider value={{
            progressRef, isPlaying, isLoading, currentTimeStr, duration,
            currentTrackUrl, activeMetadata, volume,
            setActiveMetadata, setIsLoading, setVolume,
            loadTrack, togglePlay, seek, getCurrentTime, forceSync
        }}>

            <div className="hidden">
                {isYouTube && (
                    <ReactPlayer
                        ref={ytPlayerRef}
                        url={currentTrackUrl || ""}
                        playing={isPlaying}
                        volume={volume}
                        onProgress={(s) => {
                            setCurrentTimeStr(formatTime(s.playedSeconds));
                            if (progressRef.current) progressRef.current.style.width = `${s.played * 100}%`;
                        }}
                //         onDuration={(d) => { setDurationSec(d); setDuration(formatTime(d)); }}
                        // onBuffer={() => setIsLoading(true)}
                     //   onBufferEnd={() => setIsLoading(false)}
                        onReady={() => setIsLoading(false)}
                        width="0"
                        height="0"
                    />
                )}
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