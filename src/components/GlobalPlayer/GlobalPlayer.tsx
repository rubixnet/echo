"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useRoomPlaybackSync } from "@/hooks/useRoomContext";
import { useUser } from "@/hooks/useUser";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DesktopDrawer } from "./DesktopDrawer";
import { DesktopMiniPlayer } from "./DesktopMiniPlayer";
import { MobilePlayer } from "./MobilePlayer";
import { AddToPlaylistModal } from "../AddToPlaylistModal";
import { GuestModal } from "./GuestModal";

export default function GlobalPlayer() {
  const user = useUser();
  const userId = user?._id;

  const { activeMetadata, isPlaying, setOnTrackEnd, pause } = useAudioEngine();
  const { playNext, playPrevious } = useGlobalPlayback();
  const { isGuest, hostTogglePlay, hostSeekTo } = useRoomPlaybackSync();

  const updateCurrentTrack = useMutation(api.tracks.updateCurrentTrack);

  const playNextRef = useRef(playNext);
  const guestRef = useRef(isGuest);

  useEffect(() => {
    playNextRef.current = playNext;
    guestRef.current = isGuest;
  }, [playNext, isGuest]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let timer: NodeJS.Timeout | null = null;

    if (
      isPlaying &&
      activeMetadata?.id &&
      activeMetadata.title &&
      activeMetadata.artist
    ) {

      const trackPayload = {
        trackId: activeMetadata.id,
        title: activeMetadata.title,
        artist: activeMetadata.artist,
        coverUrl: activeMetadata.coverUrl || "",
        duration: String(activeMetadata.duration ?? "0:00"),
      };

      timer = setTimeout(() => {
        updateCurrentTrack({
          userId,
          track: trackPayload,
        }).catch(() => { });
      }, 8000);
    }
    else if (!isPlaying) {
      updateCurrentTrack({
        userId,
        track: undefined,
      }).catch(() => { });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [userId, isPlaying, activeMetadata, updateCurrentTrack]);

  const handleGlobalTogglePlay = useCallback(() => {
    hostTogglePlay();
  }, [hostTogglePlay]);

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