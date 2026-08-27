import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import React, { useEffect } from "react";

/**
 * Regression tests for the "host can pause but never resume" bug.
 *
 * Root cause: room control callbacks memoized with stable deps captured an
 * EARLY version of the audio engine whose play() closed over a null
 * currentTrackUrl and no-opped forever. The fix routes all engine access
 * through a mirror that is refreshed on every render.
 *
 * These tests simulate the real AudioProvider contract: engine callbacks
 * CHANGE IDENTITY as state changes (each play() version is tagged), so
 * calling a stale capture fails the assertion.
 */

const { useQueryMock, useMutationMock, API_SENTINELS, mockState } =
  vi.hoisted(() => ({
    useQueryMock: vi.fn(),
    useMutationMock: vi.fn(),
    API_SENTINELS: {
      profile: { __sentinel: "getUserProfile" },
      activeRoom: { __sentinel: "getMyActiveRoom" },
    },
    mockState: { userId: "user-host-1" },
  }));

vi.mock("convex/react", () => ({
  useQuery: (fnRef: unknown, args: unknown) => useQueryMock(fnRef, args),
  useMutation: () => useMutationMock(),
}));

// anyApi refs are opaque (never identity-equal), so swap the generated
// api module for sentinel objects we can match on.
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    users: { getUserProfile: API_SENTINELS.profile },
    rooms: { getMyActiveRoom: API_SENTINELS.activeRoom },
  },
}));

vi.mock("@/hooks/useUser", () => ({
  useUser: () => ({ _id: mockState.userId }),
}));

vi.mock("@/hooks/useServerTimeOffset", () => ({
  useServerTimeOffset: () => 0,
}));

/* Fake engine that mimics AudioProvider: callbacks are recreated with new
   identities whenever the fixture advances, and each identity records its
   generation. A stale closure calls an OLD generation. */
interface EngineFixture {
  isPlaying: boolean;
  currentTimeSec: number;
  durationSec: number;
  currentTrackUrl: string | null;
  isAudioReady: boolean;
  generation: number;
  calls: { fn: string; gen: number }[];
}

const engineFixture: EngineFixture = {
  isPlaying: false,
  currentTimeSec: 0,
  durationSec: 0,
  currentTrackUrl: null,
  isAudioReady: false,
  generation: 0,
  calls: [],
};

function record(fn: string) {
  engineFixture.calls.push({ fn, gen: engineFixture.generation });
}

function makeEngine() {
  return {
    isPlaying: engineFixture.isPlaying,
    isLoading: false,
    isAudioReady: engineFixture.isAudioReady,
    currentTimeSec: engineFixture.currentTimeSec,
    currentTimeStr: "0:00",
    durationSec: engineFixture.durationSec,
    duration: "0:00",
    currentTrackUrl: engineFixture.currentTrackUrl,
    activeMetadata: null,
    volume: 0.8,
    queue: [],
    queueIndex: -1,
    progressRef: { current: null },
    onTrackEndRef: { current: () => {} },
    onTrackErrorRef: { current: () => {} },
    isOnLoop: false,
    isInRoom: false,
    setActiveMetadata: vi.fn(),
    setIsLoading: vi.fn(),
    setVolume: vi.fn(),
    setQueue: vi.fn(),
    setQueueIndex: vi.fn(),
    setIsOnLoop: vi.fn(),
    setIsInRoom: vi.fn(),
    setOnTrackEnd: vi.fn(),
    setOnTrackError: vi.fn(),
    seek: vi.fn(),
    forceSync: vi.fn(),
    loadTrack: () => {
      record("loadTrack");
      // Real loadTrack starts playback.
      engineFixture.isPlaying = true;
    },
    togglePlay: () => {
      record("togglePlay");
      engineFixture.isPlaying = !engineFixture.isPlaying;
    },
    play: () => {
      record("play");
      // Mirrors `if (!currentTrackUrl) return;` in AudioProvider.
      if (!engineFixture.currentTrackUrl) return;
      engineFixture.isPlaying = true;
    },
    pause: () => {
      record("pause");
      engineFixture.isPlaying = false;
    },
    seekToTime: (t: number) => {
      record("seekToTime");
      engineFixture.currentTimeSec = t;
    },
    getCurrentTime: () => engineFixture.currentTimeSec,
  };
}

vi.mock("@/components/providers/AudioProvider", () => ({
  useAudioEngine: () => makeEngine(),
}));

import { RoomProvider, useRoomContext } from "../useRoomContext";

const HOST_ID = "user-host-1" as const;
const ROOM_ID = "room-1" as const;

let broadcastFn: ReturnType<typeof vi.fn> = vi.fn();

function primeConvexMocks(opts: {
  trackId?: string | null;
  hostId?: string;
} = {}) {
  const hostId = opts.hostId ?? HOST_ID;
  useQueryMock.mockImplementation((fnRef: unknown) => {
    if (fnRef === API_SENTINELS.profile) {
      return { _id: HOST_ID, activeRoomId: ROOM_ID };
    }
    if (fnRef === API_SENTINELS.activeRoom) {
      return {
        _id: ROOM_ID,
        name: "Test Room",
        hostId,
        isPlaying: true,
        pausePosition: 0,
        serverStartTime: Date.now() - 1000,
        listeners: [HOST_ID],
        isPublic: true,
        lastActiveAt: Date.now(),
        currentTrackId: opts.trackId ?? "dQw4w9WgXcQ",
        track: opts.trackId
          ? {
              _id: "t1",
              youtubeId: opts.trackId,
              title: "Song",
              artist: "Artist",
              coverUrl: "",
              audioUrl: `/api/youtube/stream?id=${opts.trackId}`,
            }
          : null,
      };
    }
    return null;
  });
  broadcastFn = vi.fn().mockResolvedValue({ ok: true });
  useMutationMock.mockReturnValue(broadcastFn);
}

/** Advances the fake engine the way the real app would after events. */
function setEngineState(patch: Partial<EngineFixture>) {
  Object.assign(engineFixture, patch);
  engineFixture.generation += 1;
}

let contextRef: ReturnType<typeof useRoomContext> | null = null;
const rerenderRef: { current: (() => Promise<void>) | null } = { current: null };

function Probe() {
  const ctx = useRoomContext();
  useEffect(() => {
    contextRef = ctx;
  });
  return <button onClick={() => ctx.controlTogglePlay()}>toggle</button>;
}

async function renderProvider(): Promise<{ rerender: () => Promise<void> }> {
  contextRef = null;
  const utils = render(
    <RoomProvider>
      <Probe />
    </RoomProvider>,
  );
  await act(async () => {});
  // Re-render the provider like real app renders would, refreshing the
  // internal latest-values mirror after engine fixtures change.
  const rerender = async () => {
    await act(async () => {
      utils.rerender(
        <RoomProvider>
          <Probe />
        </RoomProvider>,
      );
    });
  };
  return { ...utils, rerender };
}

/** Helper: the probe button re-renders with the provider. */
function screen_toggle(): HTMLElement {
  const btn = document.querySelector("button");
  if (!btn) throw new Error("probe button not found");
  return btn;
}

beforeEach(() => {
  vi.clearAllMocks();
  engineFixture.calls = [];
  engineFixture.generation = 0;
  mockState.userId = HOST_ID;
  setEngineState({
    isPlaying: false,
    currentTimeSec: 0,
    durationSec: 0,
    currentTrackUrl: null,
    isAudioReady: false,
  });
  primeConvexMocks({ trackId: "dQw4w9WgXcQ" });
});

describe("RoomProvider host transport controls", () => {
  it("host can PAUSE then RESUME - even though engine.play() changed identity since mount", async () => {
    // Host is mid-track when the app mounted.
    setEngineState({
      isPlaying: true,
      currentTrackUrl: "/api/youtube/stream?id=dQw4w9WgXcQ",
      currentTimeSec: 42,
      durationSec: 300,
      isAudioReady: true,
    });

    const { rerender } = await renderProvider();
    rerenderRef.current = rerender;

    // Pause.
    await act(async () => {
      fireEvent.click(screen_toggle());
    });
    expect(engineFixture.isPlaying).toBe(false);

    // ...time passes, engine callbacks get NEW identities (real renders)...
    setEngineState({
      isPlaying: false,
      currentTimeSec: 45,
    });
    await act(async () => {
      await rerenderRef.current?.();
    });

    // Resume - THE regression: this must call the CURRENT play(), not the
    // stale mount-time capture that no-ops on a loaded track.
    await act(async () => {
      fireEvent.click(screen_toggle());
    });
    expect(engineFixture.isPlaying).toBe(true);

    const plays = engineFixture.calls.filter((c) => c.fn === "play");
    expect(plays.length).toBeGreaterThan(0);
    // Must have used a recent generation, not the frozen one from mount.
    expect(plays[plays.length - 1].gen).toBe(engineFixture.generation);
  });

  it("broadcasts the resumed state to listeners", async () => {
    setEngineState({
      isPlaying: false,
      currentTrackUrl: "/api/youtube/stream?id=dQw4w9WgXcQ",
      currentTimeSec: 30,
      durationSec: 300,
      isAudioReady: true,
    });

    await renderProvider();

    await act(async () => {
      fireEvent.click(screen_toggle());
    });

    expect(broadcastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: ROOM_ID,
        isPlaying: true,
        userId: HOST_ID,
      }),
    );
  });

  it("resuming a finished track restarts from zero", async () => {
    setEngineState({
      isPlaying: false,
      currentTrackUrl: "/api/youtube/stream?id=dQw4w9WgXcQ",
      currentTimeSec: 299.9,
      durationSec: 300,
      isAudioReady: true,
    });

    await renderProvider();

    await act(async () => {
      fireEvent.click(screen_toggle());
    });

    expect(engineFixture.currentTimeSec).toBe(0);
    expect(engineFixture.isPlaying).toBe(true);
  });

  it("guests cannot toggle - lockdown opens instead", async () => {
    mockState.userId = "guest-user-9";
    useQueryMock.mockImplementation((fnRef: unknown) => {
      if (fnRef === API_SENTINELS.profile) {
        return { _id: "guest-user-9", activeRoomId: ROOM_ID };
      }
      if (fnRef === API_SENTINELS.activeRoom) {
        return {
          _id: ROOM_ID,
          hostId: HOST_ID, // someone else hosts
          isPlaying: true,
          pausePosition: 0,
          listeners: [HOST_ID],
          isPublic: true,
          lastActiveAt: Date.now(),
          currentTrackId: "abc12345678",
          track: null,
        };
      }
      return null;
    });

    await renderProvider();
    expect(contextRef!.isGuest).toBe(true);

    await act(async () => {
      fireEvent.click(screen_toggle());
    });
    expect(contextRef!.isLockdownOpen).toBe(true);
    expect(engineFixture.calls.some((c) => c.fn === "togglePlay")).toBe(false);
  });
});
