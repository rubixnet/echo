"use client";

import { useEffect, useState, useRef } from "react";
import {
  Music,
} from "@/components/icons";
import {
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackMetadata } from "@/lib/trackUtils";

interface LyricLine {
  time: number;
  text: string;
}

interface SyncedLyricsProps {
  activeMetadata: (TrackMetadata & { syncedLyrics?: string }) | null;
  currentTimeSec: number;
  seekToTime: (time: number) => void;
  isPlaying?: boolean;
  durationSec?: number;
}

const ACTIVE_LINE_TOP = 0.28;

export function SyncedLyrics({
  activeMetadata,
  currentTimeSec,
  seekToTime,
  isPlaying,
  durationSec,
}: SyncedLyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const plainContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const prevTrackIdRef = useRef<string | null>(null);

  // Reset the scroll position whenever a new track's content appears.
  useEffect(() => {
    const trackId =
      activeMetadata?.trackId || activeMetadata?.audioUrl?.split("id=")[1] || "";
    const container = lyricsContainerRef.current || plainContainerRef.current;
    if (!container) return;
    if (trackId !== prevTrackIdRef.current) {
      prevTrackIdRef.current = trackId;
      container.scrollTop = 0;
    }
  });

  useEffect(() => {
    const trackId =
      activeMetadata?.trackId || activeMetadata?.audioUrl?.split("id=")[1];
    if (!trackId) return;

    const fetchLyrics = async () => {
      if (activeMetadata?.syncedLyrics) {
        try {
          const parsed = JSON.parse(activeMetadata.syncedLyrics);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLyrics(parsed);
            setPlainLyrics("");
            setError(false);
            return;
          }
        } catch {}
      }

      setIsFetching(true);
      setError(false);
      setLyrics([]);
      setPlainLyrics("");

      const params = new URLSearchParams({
        title: activeMetadata?.title || "",
        artist: activeMetadata?.artist || "",
      });
      if (durationSec && durationSec > 0) {
        params.set("duration", String(Math.round(durationSec)));
      }

      try {
        const res = await fetch(`/api/youtube/lyrics?${params.toString()}`);

        if (!res.ok) {
          throw new Error("No lyrics found");
        }

        const data = await res.json();

        if (data.lyrics && data.lyrics.length > 0) {
          setLyrics(data.lyrics);
        } else if (data.plainLyrics) {
          setPlainLyrics(data.plainLyrics);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Lyrics Engine failed:", err);
        setError(true);
      } finally {
        setIsFetching(false);
      }
    };

    fetchLyrics();
  }, [
    activeMetadata?.trackId,
    activeMetadata?.audioUrl,
    activeMetadata?.syncedLyrics,
    activeMetadata?.title,
    activeMetadata?.artist,
    durationSec,
  ]);

  const activeLineIndex = lyrics.findLastIndex(
    (line) => line.time <= currentTimeSec + 0.3,
  );

  // Follow the active line at ~28% from the top (not dead-centre).
  useEffect(() => {
    const container = lyricsContainerRef.current;
    const el = activeLyricRef.current;
    if (!container || !el) return;
    const relTop =
      el.getBoundingClientRect().top - container.getBoundingClientRect().top;
    const target =
      container.scrollTop + relTop - container.clientHeight * ACTIVE_LINE_TOP;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeLineIndex]);

  if (isFetching) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-foreground/50 w-full py-20">
        <Loader2 size={40} className="animate-spin mb-4 text-foreground/30" />
        <p className="font-medium animate-pulse">Hunting for lyrics...</p>
      </div>
    );
  }

  if (plainLyrics) {
    return (
      <div
        ref={plainContainerRef}
        className="h-full w-full overflow-y-auto px-4 md:px-12 py-16 space-y-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {plainLyrics.split(/\r?\n/).map((line, index) =>
          line.trim() ? (
            <p
              key={index}
              className="font-serif text-xl md:text-2xl font-medium leading-relaxed text-foreground/75"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
            >
              {line}
            </p>
          ) : (
            <div key={index} className="h-4" />
          ),
        )}
      </div>
    );
  }

  const showEmpty =
    (error || lyrics.length === 0) && !plainLyrics;

  if (showEmpty) {
    // Don't warn about missing lyrics before the song has actually started.
    if (!isPlaying) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center p-12 w-full py-20">
          <Music size={48} className="text-foreground/15 mb-4" />
          <p className="text-foreground/35 text-sm font-medium tracking-wide">
            Press play to see the lyrics
          </p>
        </div>
      );
    }
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 w-full py-20">
        <Music size={48} className="text-foreground/20 mb-4" />
        <h2 className="text-2xl font-black text-foreground/50 tracking-tight">
          No Lyrics Found
        </h2>
        <p className="text-foreground/40 mt-2 font-medium">Enjoy the music.</p>
      </div>
    );
  }

  return (
    <div
      ref={lyricsContainerRef}
      className="h-full w-full overflow-y-auto px-4 md:px-12 py-16 space-y-8 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
      }}
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
              "font-serif text-2xl md:text-4xl font-semibold tracking-tight transition-all duration-500 ease-out cursor-pointer origin-left hover:text-foreground",
              isActive
                ? "text-foreground scale-[1.03] opacity-100 blur-none"
                : isPassed
                  ? "text-foreground/45 scale-100 opacity-55 blur-[0.5px] hover:blur-none hover:opacity-100"
                  : "text-foreground/30 scale-100 opacity-30 blur-[1px] hover:blur-none hover:opacity-100",
            )}
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}