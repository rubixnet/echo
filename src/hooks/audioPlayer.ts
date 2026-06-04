import { useRef, useState, useEffect } from 'react';

export function useAudioEngine() {

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null); // This holds our UI progress bar

    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState("0:00");
    const [currentTimeStr, setCurrentTimeStr] = useState("0:00");

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        audioRef.current = new Audio();
        let animationFrameId: number;

        const updateProgress = () => {
            if (audioRef.current && progressRef.current) {
                const { currentTime, duration } = audioRef.current;
                if (duration > 0) {
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
            if (audioRef.current) {
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

    const loadTrack = (url: string) => {
        if (!audioRef.current) return;
        audioRef.current.src = url;
        audioRef.current.load();
        audioRef.current.play();
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };
    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;

        const bounds = e.currentTarget.getBoundingClientRect();
        const clickPositionPercent = (e.clientX - bounds.left) / bounds.width;

        audioRef.current.currentTime = clickPositionPercent * audioRef.current.duration;
    };

    return {
        progressRef,
        isPlaying,
        currentTimeStr,
        duration,
        loadTrack,
        togglePlay,
        seek
    };
}
