"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useUser } from "@/hooks/useUser";
import { useAudioEngine } from "@/components/AudioProvider";
import { useServerTimeOffset } from "@/hooks/useServerTimeOffset";
import { resolveFollowAction } from "@/lib/roomFollow";

/**
 * Room core: membership + playback sync for the WHOLE app.
 *
 * Mounted once in the dashboard layout. Everything room-related hangs off
 * this single provider:
 *
 *  - Membership is a live Convex query (rooms.getMyActiveRoom), never the
 *    stale SSR user snapshot - so it is correct on every page.
 *  - Guests follow the host's transport wherever they are; hosts broadcast
 *    play/pause/seek/skip to every listener.
 *  - The guest lockdown modal lives here as plain state (no window events).
 *  - Host presence: heartbeat while the app is open + instant teardown via
 *    a sendBeacon when the site closes; an expiry cron is the safety net.
 */

export const HEARTBEAT_INTERVAL_MS = 15_000;

export type ActiveRoom = Doc<"rooms"> & {
  track: Doc<"tracks"> | null;
};

interface RoomContextValue {
  roomId: Id<"rooms"> | null;
  room: ActiveRoom | null;
  /** True until the first membership queries resolve. */
  roomLoading: boolean;
  isInRoom: boolean;
  isHost: boolean;
  isGuest: boolean;
  /** Play/pause that respects the room: hosts broadcast, guests locked. */
  controlTogglePlay: () => void;
  /** Seek that respects the room: hosts broadcast, guests locked. */
  controlSeekTo: (seconds: number) => void;
  /** Restart the current track from 0 (hosts broadcast the restart). */
  controlRestart: () => void;
  leaveRoom: () => Promise<void>;
  closeRoom: () => Promise<void>;
  /** Guest lockdown modal state. */
  isLockdownOpen: boolean;
  openLockdown: () => void;
  closeLockdown: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const userId = user?._id as Id<"users"> | undefined;

  /* -------------------------------------------------------------- */
  /* Live membership - the single source of truth                    */
  /* -------------------------------------------------------------- */

  const liveProfile = useQuery(
    api.users.getUserProfile,
    userId ? { userId } : "skip",
  );
  const activeRoomId = liveProfile?.activeRoomId ?? undefined;

  const room = useQuery(
    api.rooms.getMyActiveRoom,
    userId ? { userId } : "skip",
  ) as ActiveRoom | null | undefined;

  const clearStaleMembership = useMutation(api.rooms.clearStaleMembership);
  const leaveRoomMutation = useMutation(api.rooms.leaveRoom);
  const closeRoomMutation = useMutation(api.rooms.closeRoom);
  const syncPlaybackMutation = useMutation(api.rooms.syncPlayback);
  const keepAliveMutation = useMutation(api.rooms.keepRoomAlive);

  const engine = useAudioEngine();
  const serverOffsetMs = useServerTimeOffset();

  const isHost =
    !!userId && !!room && (room.hostId as string) === (userId as string);
  const isGuest = !!userId && !!room && !isHost;
  const isInRoom = !!activeRoomId && !!room;
  const roomLoading =
    userId !== undefined && (liveProfile === undefined || room === undefined);

  /* -------------------------------------------------------------- */
  /* Self-heal stale pointers                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!userId || !activeRoomId) return;
    if (liveProfile !== undefined && room === null) {
      clearStaleMembership({ userId, roomId: activeRoomId }).catch(() => {});
    }
  }, [userId, activeRoomId, liveProfile, room, clearStaleMembership]);

  /* -------------------------------------------------------------- */
  /* Keep AudioProvider's history-gate in sync                       */
  /* -------------------------------------------------------------- */

  const prevInRoomRef = useRef(false);
  useEffect(() => {
    latest.current.ex.setIsInRoom(isInRoom);
    // Mirrored audio stops when the room disappears so users are never
    // left hanging after the host closes or they leave.
    if (prevInRoomRef.current && !isInRoom) latest.current.ex.pause();
    prevInRoomRef.current = isInRoom;
  }, [isInRoom]);

  /* -------------------------------------------------------------- */
  /* Latest-values mirror (read from intervals / callbacks)          */
  /*                                                                 */
  /* AudioProvider recreates play/pause/etc. as the track changes;   */
  /* memoized callbacks must NEVER close over `engine` directly or   */
  /* they freeze an early no-op version (the "can't resume" bug).    */
  /* -------------------------------------------------------------- */

  const latest = useRef({
    isGuest,
    room,
    serverOffsetMs,
    durationSec: engine.durationSec,
    localTimeSec: engine.currentTimeSec,
    localIsPlaying: engine.isPlaying,
    localTrackUrl: engine.currentTrackUrl,
    audioReady: engine.isAudioReady,
    ex: {
      play: engine.play,
      pause: engine.pause,
      togglePlay: engine.togglePlay,
      seekToTime: engine.seekToTime,
      loadTrack: engine.loadTrack,
      getCurrentTime: engine.getCurrentTime,
      setIsInRoom: engine.setIsInRoom,
    },
  });

  useEffect(() => {
    // Latest-value mirror: written post-commit, read from intervals and
    // memoized callbacks so they never fire stale engine captures.
    // eslint-disable-next-line react-hooks/immutability
    latest.current = {
      isGuest,
      room,
      serverOffsetMs,
      durationSec: engine.durationSec,
      localTimeSec: engine.currentTimeSec,
      localIsPlaying: engine.isPlaying,
      localTrackUrl: engine.currentTrackUrl,
      audioReady: engine.isAudioReady,
      ex: {
        play: engine.play,
        pause: engine.pause,
        togglePlay: engine.togglePlay,
        seekToTime: engine.seekToTime,
        loadTrack: engine.loadTrack,
        getCurrentTime: engine.getCurrentTime,
        setIsInRoom: engine.setIsInRoom,
      },
    };
  });

  /* -------------------------------------------------------------- */
  /* Guest follow engine                                             */
  /* -------------------------------------------------------------- */

  const lastSeekAtRef = useRef(0);
  // Whenever the host publishes a new authoritative position (play after
  // pause, seek, new track), followers may snap immediately without
  // waiting out the anti-loop seek throttle.
  const authorityKeyRef = useRef("");

  const runFollowTick = useCallback(() => {
    const s = latest.current;
    if (!s.isGuest || !s.room) return;

    const authKey = `${s.room._id}:${s.room.currentTrackId}:${s.room.serverStartTime ?? 0}:${s.room.pausePosition}`;
    const freshAuthority = authKey !== authorityKeyRef.current;
    authorityKeyRef.current = authKey;

    const action = resolveFollowAction(
      {
        roomTrackUrl: s.room.track?.audioUrl ?? null,
        roomIsPlaying: s.room.isPlaying,
        roomPausePositionSec: s.room.pausePosition ?? 0,
        serverStartTime: s.room.serverStartTime,
        serverOffsetMs: s.serverOffsetMs,
        durationSec: s.durationSec,
        localTrackUrl: s.localTrackUrl,
        localIsPlaying: s.localIsPlaying,
        localTimeSec: s.localTimeSec,
        audioReady: s.audioReady,
      },
      freshAuthority ? 0 : lastSeekAtRef.current,
    );

    switch (action.type) {
      case "none":
        break;
      case "load_track":
        // Joining a paused room must not start blasting audio.
        s.ex.loadTrack(
          action.url,
          {
            title: s.room.track?.title,
            artist: s.room.track?.artist,
            coverUrl: s.room.track?.coverUrl,
          },
          { autoPlay: s.room.isPlaying },
        );
        break;
      case "play":
        s.ex.play();
        break;
      case "pause":
        s.ex.pause();
        break;
      case "seek":
        lastSeekAtRef.current = Date.now();
        s.ex.seekToTime(action.positionSec);
        break;
    }
  }, []);

  // Immediate reaction whenever the host's state changes...
  useEffect(() => {
    runFollowTick();
  }, [
    runFollowTick,
    room?._id,
    room?.currentTrackId,
    room?.isPlaying,
    room?.serverStartTime,
    room?.pausePosition,
    isGuest,
  ]);

  // ...plus a light poll to correct clock drift continuously.
  useEffect(() => {
    if (!isGuest) return;
    const interval = setInterval(runFollowTick, 500);

    // Browsers block audio until a user gesture. If a guest loads the app
    // while the host is already playing, the first interaction starts
    // mirrored playback instantly.
    const unlock = () => {
      const s = latest.current;
      if (s.room?.isPlaying && !s.localIsPlaying && s.audioReady) {
        s.ex.play();
      }
    };
    window.addEventListener("pointerdown", unlock);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pointerdown", unlock);
    };
  }, [isGuest, runFollowTick]);

  /* -------------------------------------------------------------- */
  /* Host presence: heartbeat + instant close on site exit           */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!isHost || !activeRoomId) return;

    const beat = () =>
      keepAliveMutation({ roomId: activeRoomId, userId }).catch(() => {});

    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", onVisible);

    const onPageHide = () => {
      try {
        navigator.sendBeacon(
          "/api/rooms/close-on-unload",
          new Blob([JSON.stringify({ roomId: activeRoomId })], {
            type: "application/json",
          }),
        );
      } catch {
        /* best effort */
      }
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [isHost, activeRoomId, userId, keepAliveMutation]);

  /* -------------------------------------------------------------- */
  /* Guest lockdown modal state                                      */
  /* -------------------------------------------------------------- */

  const [isLockdownOpen, setIsLockdownOpen] = useState(false);
  const openLockdown = useCallback(
    () => setIsLockdownOpen(true),
    [setIsLockdownOpen],
  );
  const closeLockdown = useCallback(
    () => setIsLockdownOpen(false),
    [setIsLockdownOpen],
  );

  /* -------------------------------------------------------------- */
  /* Actions                                                         */
  /* -------------------------------------------------------------- */

  /** Element-accurate position (not a render-captured state value). */
  const livePosition = useCallback(() => {
    try {
      const t = latest.current.ex.getCurrentTime();
      if (typeof t === "number" && isFinite(t)) return t;
    } catch {
      /* fall through to state */
    }
    return latest.current.localTimeSec;
  }, []);

  const controlTogglePlay = useCallback(() => {
    const s = latest.current;
    if (s.isGuest) {
      setIsLockdownOpen(true);
      return;
    }

    // Derive intent from what is AUDIBLE locally, never from the room doc -
    // a stale subscription must never swallow a play/pause click.
    const willPlay = !s.localIsPlaying;

    // Resuming a track that sits at its end must restart, not re-end.
    const atEnd =
      s.durationSec > 0 && livePosition() >= s.durationSec - 0.25;
    if (willPlay && atEnd) {
      s.ex.seekToTime(0);
    }

    if (s.room && (s.room.hostId as string) === (userId as string)) {
      syncPlaybackMutation({
        roomId: s.room._id,
        isPlaying: willPlay,
        clientCurrentTime: atEnd && willPlay ? 0 : livePosition(),
        userId: userId!,
      }).catch((err) =>
        console.warn("[room] play/pause broadcast failed:", err),
      );
    }
    if (willPlay) s.ex.play();
    else s.ex.pause();
  }, [userId, syncPlaybackMutation, livePosition]);

  const controlSeekTo = useCallback(
    (seconds: number) => {
      const s = latest.current;
      if (s.isGuest) {
        setIsLockdownOpen(true);
        return;
      }
      s.ex.seekToTime(seconds);
      if (s.room && (s.room.hostId as string) === (userId as string)) {
        syncPlaybackMutation({
          roomId: s.room._id,
          isPlaying: s.room.isPlaying,
          clientCurrentTime: seconds,
          userId: userId!,
        }).catch(() => {});
      }
    },
    [userId, syncPlaybackMutation],
  );

  const controlRestart = useCallback(() => {
    const s = latest.current;
    if (s.isGuest) {
      setIsLockdownOpen(true);
      return;
    }
    s.ex.seekToTime(0);
    s.ex.play();
    if (s.room && (s.room.hostId as string) === (userId as string)) {
      syncPlaybackMutation({
        roomId: s.room._id,
        isPlaying: true,
        clientCurrentTime: 0,
        userId: userId!,
      }).catch(() => {});
    }
  }, [userId, syncPlaybackMutation]);

  const leaveRoom = useCallback(async () => {
    if (!activeRoomId || !userId) return;
    try {
      await leaveRoomMutation({ roomId: activeRoomId, userId });
      latest.current.ex.pause();
    } catch {
      /* room errors never reach the UI */
    }
  }, [activeRoomId, userId, leaveRoomMutation]);

  const closeRoom = useCallback(async () => {
    if (!activeRoomId || !userId) return;
    try {
      await closeRoomMutation({ roomId: activeRoomId, userId });
      latest.current.ex.pause();
    } catch {
      /* room errors never reach the UI */
    }
  }, [activeRoomId, userId, closeRoomMutation]);

  return (
    <RoomContext.Provider
      value={{
        roomId: activeRoomId ?? null,
        room: room ?? null,
        roomLoading,
        isInRoom,
        isHost,
        isGuest,
        controlTogglePlay,
        controlSeekTo,
        controlRestart,
        leaveRoom,
        closeRoom,
        isLockdownOpen,
        openLockdown,
        closeLockdown,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext(): RoomContextValue {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error("useRoomContext must be used within <RoomProvider>");
  }
  return ctx;
}

/** Room state for UI consumers (live on every page). */
export function useRoomState() {
  const ctx = useRoomContext();
  const leaveRoom = useCallback(async () => {
    await ctx.leaveRoom();
  }, [ctx]);

  return {
    isInRoom: ctx.isInRoom,
    isHost: ctx.isHost,
    isGuest: ctx.isGuest,
    room: ctx.room,
    roomId: ctx.roomId,
    roomLoading: ctx.roomLoading,
    controlTogglePlay: ctx.controlTogglePlay,
    controlSeekTo: ctx.controlSeekTo,
    controlRestart: ctx.controlRestart,
    leaveRoom,
    closeRoom: ctx.closeRoom,
    isLockdownOpen: ctx.isLockdownOpen,
    openLockdown: ctx.openLockdown,
    closeLockdown: ctx.closeLockdown,
  };
}

/** Playback-sync surface for the GlobalPlayer. */
export function useRoomPlaybackSync() {
  const ctx = useRoomContext();
  return {
    room: ctx.room,
    activeRoomId: ctx.roomId,
    isInRoom: ctx.isInRoom,
    isHost: ctx.isHost,
    isGuest: ctx.isGuest,
    hostTogglePlay: ctx.controlTogglePlay,
    hostSeekTo: ctx.controlSeekTo,
  };
}
