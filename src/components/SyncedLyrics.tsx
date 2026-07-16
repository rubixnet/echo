"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface LyricLine {
    time: number;
    text: string;
}

interface SyncedLyricsProps {
    activeMetadata: any;
    currentTimeSec: number;
    seekToTime: (time: number) => void;
}

export function SyncedLyrics({ activeMetadata, currentTimeSec, seekToTime }: SyncedLyricsProps) {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState(false);

    const saveLyricsToDB = useMutation(api.tracks.saveLyrics);

    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const activeLyricRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        const youtubeId = activeMetadata?.youtubeId || activeMetadata?.audioUrl?.split("id=")[1];
        if (!youtubeId) return;

        const fetchLyrics = async () => {
            if (activeMetadata.syncedLyrics) {
                try {
                    setLyrics(JSON.parse(activeMetadata.syncedLyrics));
                    setError(false);
                } catch (e) { }
                return;
            }

            setIsFetching(true);
            setError(false);
            setLyrics([]);

            try {
                const res = await fetch(`/api/lyrics?id=${youtubeId}&title=${encodeURIComponent(activeMetadata.title || "")}&artist=${encodeURIComponent(activeMetadata.artist || "")}`);

                if (!res.ok) {
                    throw new Error("No lyrics found");
                }

                const data = await res.json();

                if (data.lyrics && data.lyrics.length > 0) {
                    setLyrics(data.lyrics);

                    if (activeMetadata.id) {
                        saveLyricsToDB({
                            trackId: activeMetadata.id as any,
                            syncedLyrics: JSON.stringify(data.lyrics)
                        }).catch(console.error);
                    }
                } else {
                    setError(true);
                }
            } catch (err: any) {
                console.error("Lyrics Engine failed:", err);
                setError(true);
            } finally {
                setIsFetching(false);
            }
        };

        fetchLyrics();
    }, [activeMetadata?.youtubeId, activeMetadata?.audioUrl, activeMetadata?.syncedLyrics, activeMetadata?.id, activeMetadata?.title, activeMetadata?.artist, saveLyricsToDB]);

    const activeLineIndex = lyrics.findLastIndex((line) => line.time <= currentTimeSec + 0.3);

    useEffect(() => {
        if (activeLyricRef.current && lyricsContainerRef.current) {
            activeLyricRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [activeLineIndex]);

    if (isFetching) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-foreground/50 w-full py-20">
                <Loader2 size={40} className="animate-spin mb-4 text-foreground/30" />
                <p className="font-medium animate-pulse">Hunting for lyrics...</p>
            </div>
        );
    }

    if (error || lyrics.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 w-full py-20">
                <Music size={48} className="text-foreground/20 mb-4" />
                <h2 className="text-2xl font-black text-foreground/50 tracking-tight">No Lyrics Found</h2>
                <p className="text-foreground/40 mt-2 font-medium">Enjoy the music.</p>
            </div>
        );
    }

    return (
        <div
            ref={lyricsContainerRef}
            className="h-full w-full overflow-y-auto px-4 md:px-12 py-[40vh] space-y-8 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
        >
            {lyrics.map((line, index) => {
                const isActive = index === activeLineIndex;
                const isPassed = index < activeLineIndex;

                return (
                    <p
                        key={index}
                        ref={isActive ? activeLyricRef : null}
                        onClick={() => seekToTime(line.time)}
                        className={cn(
                            "text-2xl md:text-4xl font-black tracking-tight transition-all duration-500 ease-out cursor-pointer origin-left hover:text-foreground",
                            isActive
                                ? "text-foreground scale-105 opacity-100 blur-none"
                                : isPassed
                                    ? "text-foreground/40 scale-100 opacity-50 blur-[0.5px] hover:blur-none hover:opacity-100"
                                    : "text-foreground/30 scale-100 opacity-30 blur-[1px] hover:blur-none hover:opacity-100"
                        )}
                    >
                        {line.text}
                    </p>
                );
            })}
        </div>
    );


}