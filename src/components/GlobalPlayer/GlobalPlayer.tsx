"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAudioEngine } from "@/components/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useRoomPlaybackSync } from "@/hooks/useRoomContext";
import { DesktopDrawer } from "./DesktopDrawer";
import { DesktopMiniPlayer } from "./DesktopMiniPlayer";
import { MobilePlayer } from "./MobilePlayer";
import { AddToPlaylistModal } from "../AddToPlaylistModal";
import { GuestModal } from "./GuestModal";

export default function GlobalPlayer() {
  const { activeMetadata, setOnTrackEnd, pause } = useAudioEngine();
  const { playNext, playPrevious } = useGlobalPlayback();
  const { isGuest, hostTogglePlay, hostSeekTo } = useRoomPlaybackSync();

  const playNextRef = useRef(playNext);
  const guestRef = useRef(isGuest);

  useEffect(() => {
    playNextRef.current = playNext;
    guestRef.current = isGuest;
  }, [playNext, isGuest]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  // Single source of truth for every play/pause + seek entry point:
  // keyboard, mediaSession and all player surfaces route through here so
  // hosts always broadcast to their listeners and guests stay locked.
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
        // Only the host advances the queue. Listeners hold at the end of
        // the track until the host broadcasts the next one.
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
