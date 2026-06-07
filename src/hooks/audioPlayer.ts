import { useRef, useEffect, useState } from 'react';

const DEFAULT_TRACK = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export function useAudioEngine() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState("0:00");
    const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
    const [currentTrackUrl, setCurrentTrackUrl] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(0.8);

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = volume;
        let animationFrameId: number;

        const updateProgress = () => {
            if (audioRef.current && progressRef.current) {
                const { currentTime, duration } = audioRef.current;
                if (duration > 0 && isFinite(duration)) {
                    const percent = (currentTime / duration) * 100;
                    progressRef.current.style.width = `${percent}%`;
                }
            }
            animationFrameId = requestAnimationFrame(updateProgress);
        };

        const handlePlay = () => {
            setIsPlaying(true);
            updateProgress();
        };

        const handlePause = () => {
            setIsPlaying(false);
            cancelAnimationFrame(animationFrameId);
        };

        const handleTimeUpdate = () => {
            if (audioRef.current) {
                setCurrentTimeStr(formatTime(audioRef.current.currentTime));
            }
        };

        const handleLoadedMetadata = () => {
            if (audioRef.current && isFinite(audioRef.current.duration)) {
                setDuration(formatTime(audioRef.current.duration));
            }
        };

        audioRef.current.addEventListener('play', handlePlay);
        audioRef.current.addEventListener('pause', handlePause);
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('play', handlePlay);
                audioRef.current.removeEventListener('pause', handlePause);
                audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
                audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            }
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const setVolume = (val: number) => {
        setVolumeState(val);
        if (audioRef.current) audioRef.current.volume = val;
    };

    const loadTrack = (url: string) => {
        if (!audioRef.current || currentTrackUrl === url) return;
        audioRef.current.src = url;
        setCurrentTrackUrl(url);
        audioRef.current.load();
        audioRef.current.play().catch(e => console.log("User interaction required for autoplay", e));
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        
        if (!currentTrackUrl) {
            loadTrack(DEFAULT_TRACK);
            return;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log("User interaction required", e));
        }
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;
        
        const duration = audioRef.current.duration;
        
        if (!duration || !isFinite(duration)) {
            console.warn("Audio duration is infinite or not loaded yet.");
            return;
        }

        const bounds = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - bounds.left;
        const clickPositionPercent = Math.max(0, Math.min(1, clickX / bounds.width));

        audioRef.current.currentTime = clickPositionPercent * duration;
        
        if (progressRef.current) {
            progressRef.current.style.width = `${clickPositionPercent * 100}%`;
        }
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
            if (audioRef.current.paused) audioRef.current.play().catch(e => console.log(e));
        } else {
            audioRef.current.currentTime = pausePosition;
            if (!audioRef.current.paused) audioRef.current.pause();
        }
    };

    return {
        progressRef,
        isPlaying,
        currentTimeStr,
        duration,
        currentTrackUrl,
        volume,
        setVolume,
        loadTrack,
        togglePlay,
        seek,
        getCurrentTime,
        forceSync
    };
}