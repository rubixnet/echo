"use client"
import React, { createContext, useContext, useRef, useState, useEffect } from "react"

interface AudioContextType {
    progressRef: React.RefObject<HTMLDivElement | null>;
    isPlaying: boolean;
    currentTimeStr: string;
    duration: string;
    currentTrackUrl: string | null;
    togglePlayLocal: () => void;
    loadTrack: (url: string) => void;
    seekLocal: (e: React.MouseEvent<HTMLDivElement>) => void;
    forceSync: (serverStartTime?: number, pausePosition?: number, forcePlay?: boolean) => void;
    getCurrentTime: () => number;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    audioRef.current = new Audio();
    let animationFrameId: number;

    const updateProgress = () => {
      if (audioRef.current && progressRef.current && audioRef.current.duration > 0) {
        const percent = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        progressRef.current.style.width = `${percent}%`;
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    const handlePlay = () => { setIsPlaying(true); updateProgress(); };
    const handlePause = () => { setIsPlaying(false); cancelAnimationFrame(animationFrameId); };
    const handleTime = () => setCurrentTimeStr(formatTime(audioRef.current!.currentTime));
    const handleMeta = () => setDuration(formatTime(audioRef.current!.duration));

    audioRef.current.addEventListener("play", handlePlay);
    audioRef.current.addEventListener("pause", handlePause);
    audioRef.current.addEventListener("timeupdate", handleTime);
    audioRef.current.addEventListener("loadedmetadata", handleMeta);


    return () => {
      audioRef.current?.pause();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const loadTrack = (url: string) => {
    if (!audioRef.current || currentTrackUrl === url) return;
    audioRef.current.src = url;
    setCurrentTrackUrl(url);
    audioRef.current.load();
  };

  const togglePlayLocal = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
  };

  const seekLocal = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const getCurrentTime = () => audioRef.current?.currentTime || 0;

  const forceSync = (serverStartTime?: number, pausePosition = 0, forcePlay = false) => {
    if (!audioRef.current) return;
    
    if (forcePlay && serverStartTime) {
      const timeRunning = Date.now() - serverStartTime;
      const targetTime = timeRunning / 1000;
      
      if (Math.abs(audioRef.current.currentTime - targetTime) > 0.5) {
        audioRef.current.currentTime = targetTime;
      }
      if (audioRef.current.paused) audioRef.current.play();
    } else {
      audioRef.current.currentTime = pausePosition;
      if (!audioRef.current.paused) audioRef.current.pause();
    }
  };

  return (
    <AudioContext.Provider value={{ progressRef, isPlaying, currentTimeStr, duration, currentTrackUrl, togglePlayLocal, loadTrack, seekLocal, forceSync, getCurrentTime }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};