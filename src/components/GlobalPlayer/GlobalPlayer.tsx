"use client";

import { useState, useRef, useEffect } from "react";
import { useAudioEngine } from "@/components/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { useRoomState } from "@/hooks/useRoomState";
import { DesktopDrawer } from "./DesktopDrawer";
import { DesktopMiniPlayer } from "./DesktopMiniPlayer";
import { MobilePlayer } from "./MobilePlayer";
import { AddToPlaylistModal } from "../AddToPlaylistModal";
import { GuestModal } from "./GuestModal";

export default function GlobalPlayer({ user }: { user?: any }) {
  const { togglePlay, activeMetadata, setOnTrackEnd, seekToTime } =
    useAudioEngine();
  const { playNext, playPrevious } = useGlobalPlayback();
  const { isGuest, leaveRoom } = useRoomState();
  const playNextRef = useRef(playNext);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  const checkGuestLockdown = () => {
    if (isGuest) {
      window.dispatchEvent(new CustomEvent("openLockdownModal"));
      return true;
    }
    return false;
  };

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    if (setOnTrackEnd) {
      setOnTrackEnd(() => playNextRef.current(true));
    }
  }, [setOnTrackEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!checkGuestLockdown()) {
          togglePlay();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, isGuest]);

  useEffect(() => {
    if ("mediaSession" in navigator && activeMetadata) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeMetadata.title,
        artist: activeMetadata.artist,
        artwork: [
          {
            src: activeMetadata.coverUrl,
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      });
      navigator.mediaSession.setActionHandler("play", () => {
        if (!checkGuestLockdown()) togglePlay();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (!checkGuestLockdown()) togglePlay();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        if (!checkGuestLockdown()) playPrevious();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        if (!checkGuestLockdown()) playNext(false);
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (!checkGuestLockdown() && details.seekTime !== undefined)
          seekToTime(details.seekTime);
      });
    }
  }, [activeMetadata, togglePlay, playNext, playPrevious, seekToTime, isGuest]);

  return (
    <>
      <GuestModal />
      <div className="hidden md:block">
        <DesktopDrawer isOpen={isDrawerOpen} setIsOpen={setIsDrawerOpen} />
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
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        trackId={activeMetadata?.id || null}
      />
    </>
  );
}
