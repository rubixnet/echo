"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useGlobalPlayback, type QueueType } from "@/hooks/useGlobalPlayback";
import { useRoomPlaybackSync } from "@/hooks/useRoomContext";
import { useUser } from "@/hooks/useUser";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DesktopDrawer } from "./DesktopDrawer";
import { DesktopMiniPlayer } from "./DesktopMiniPlayer";
import { MobilePlayer } from "./MobilePlayer";
import { AddToPlaylistModal } from "../AddToPlaylistModal";
import { GuestModal } from "./GuestModal";
import { normalizeTrack } from "@/lib/trackUtils";

const STORAGE_KEY = "app_last_played_track";
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function formatDurationSec(seconds: number): string | null {
  if (!seconds || isNaN(seconds) || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function GlobalPlayer() {
  const user = useUser();
  const userId = user?._id;

  const {
    activeMetadata,
    isPlaying,
    durationSec,
    setOnTrackEnd,
    pause,
    loadTrack,
    setActiveMetadata,
    setQueue,
    setQueueIndex,
  } = useAudioEngine();

  const { playTrack, playNext, playPrevious } = useGlobalPlayback();
  const { isGuest, hostTogglePlay, hostSeekTo } = useRoomPlaybackSync();

  const updateCurrentTrack = useMutation(api.tracks.updateCurrentTrack);

  const playNextRef = useRef(playNext);
  const guestRef = useRef(isGuest);
  const hydratedRef = useRef(false);

  useEffect(() => {
    playNextRef.current = playNext;
    guestRef.current = isGuest;
  }, [playNext, isGuest]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let trackToRestore: {
      trackId: string;
      title: string;
      artist: string;
      coverUrl?: string;
      duration?: string;
      isPlaying?: boolean;
      updatedAt?: number;
    } | null = null;

    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        const isFresh = Date.now() - (parsed.updatedAt ?? 0) <= TWO_DAYS_MS;
        if (isFresh && parsed.trackId) {
          trackToRestore = parsed;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch { }

    if (!trackToRestore && user?.currentTrack?.trackId) {
      const isFresh = Date.now() - (user.currentTrack.updatedAt ?? 0) <= TWO_DAYS_MS;
      if (isFresh) {
        trackToRestore = user.currentTrack;
      }
    }

    if (trackToRestore && !activeMetadata) {
      const pipeUrl = `/api/youtube/stream?id=${trackToRestore.trackId}`;
      const payload = {
        id: trackToRestore.trackId,
        trackId: trackToRestore.trackId,
        title: trackToRestore.title,
        artist: trackToRestore.artist,
        coverUrl: trackToRestore.coverUrl || "",
        audioUrl: pipeUrl,
        duration: trackToRestore.duration || "0:00",
      };

      loadTrack(pipeUrl, payload);
      setActiveMetadata(payload);
      setQueue([{ ...payload, queueType: "user" as QueueType }]);
      setQueueIndex(0);
      pause();
    }
  }, [
    user,
    activeMetadata,
    pause,
    loadTrack,
    setActiveMetadata,
    setQueue,
    setQueueIndex,
  ]);

  useEffect(() => {
    if (!activeMetadata?.id || !activeMetadata?.title || !activeMetadata?.artist) {
      return;
    }

    const resolvedDuration =
      formatDurationSec(durationSec) ||
      (activeMetadata.duration && activeMetadata.duration !== "0:00"
        ? activeMetadata.duration
        : "0:00");

    const trackPayload = {
      trackId: activeMetadata.trackId || activeMetadata.id,
      title: activeMetadata.title,
      artist: activeMetadata.artist,
      coverUrl: activeMetadata.coverUrl || "",
      duration: String(resolvedDuration),
      isPlaying,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackPayload));
    } catch { }

    if (!userId) return;

    const timer = setTimeout(() => {
      updateCurrentTrack({
        userId,
        track: trackPayload,
      }).catch(() => { });
    }, 1500);

    return () => clearTimeout(timer);
  }, [userId, isPlaying, durationSec, activeMetadata, updateCurrentTrack]);

  useEffect(() => {
    if (!isPlaying) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPlaying]);

  const handleGlobalTogglePlay = useCallback(() => {
    if (!isPlaying && activeMetadata) {
      const normalized = normalizeTrack({
        id: activeMetadata.trackId || activeMetadata.id,
        title: activeMetadata.title,
        artist: activeMetadata.artist,
        coverUrl: activeMetadata.coverUrl,
        duration: activeMetadata.duration,
      });
      playTrack(normalized);
      return;
    }
    hostTogglePlay();
  }, [isPlaying, activeMetadata, playTrack, hostTogglePlay]);

  const handleGlobalSeek = useCallback(
    (targetTime: number) => {
      hostSeekTo(targetTime);
    },
    [hostSeekTo],
  );

  useEffect(() => {
    if (setOnTrackEnd) {
      setOnTrackEnd(() => {
        if (guestRef.current) {
          pause();
          return;
        }
        playNextRef.current(true);
      });
    }
  }, [setOnTrackEnd, pause, isGuest]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        handleGlobalTogglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGlobalTogglePlay]);

  useEffect(() => {
    if ("mediaSession" in navigator && activeMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeMetadata.title,
        artist: activeMetadata.artist,
        artwork: [
          {
            src: activeMetadata.coverUrl || "",
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      });
      navigator.mediaSession.setActionHandler("play", handleGlobalTogglePlay);
      navigator.mediaSession.setActionHandler("pause", handleGlobalTogglePlay);
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (!isGuest) playPrevious();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (!isGuest) playNext(false);
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (!isGuest && details.seekTime !== undefined) {
          handleGlobalSeek(details.seekTime);
        }
      });
    }
  }, [activeMetadata, isGuest, handleGlobalTogglePlay, handleGlobalSeek, playNext, playPrevious]);

  return (
    <>
      <GuestModal />
      <div className="hidden md:block">
        <DesktopDrawer
          isOpen={isDrawerOpen}
          setIsOpen={setIsDrawerOpen}
          setIsPlaylistModalOpen={setIsPlaylistModalOpen}
        />
        <DesktopMiniPlayer
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          setIsPlaylistModalOpen={setIsPlaylistModalOpen}
        />
      </div>

      <div className="block md:hidden">
        <MobilePlayer setIsPlaylistModalOpen={setIsPlaylistModalOpen} />
      </div>

      <AddToPlaylistModal
        key={`playlist-modal-${isPlaylistModalOpen}-${activeMetadata?.id || ""}`}
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        trackId={activeMetadata?.id || null}
      />
    </>
  );
}