import { describe, it, expect } from "vitest";
import {
  resolveFollowAction,
  decideSameTrackAction,
  DRIFT_SEEK_THRESHOLD_SEC,
  MIN_SEEK_INTERVAL_MS,
  type FollowInput,
} from "../roomFollow";

const baseInput = (): FollowInput => ({
  roomTrackUrl: "/api/youtube/stream?id=dQw4w9WgXcQ",
  roomIsPlaying: true,
  roomPausePositionSec: 0,
  serverStartTime: Date.now() - 10_000,
  serverOffsetMs: 0,
  durationSec: 300,
  localTrackUrl: "/api/youtube/stream?id=dQw4w9WgXcQ",
  localIsPlaying: true,
  localTimeSec: 10,
  audioReady: true,
});

describe("resolveFollowAction", () => {
  it("loads the host's track when the follower has a different one", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      localTrackUrl: "/api/youtube/stream?id=otherID11111",
    });
    expect(action).toEqual({
      type: "load_track",
      url: "/api/youtube/stream?id=dQw4w9WgXcQ",
    });
  });

  it("loads the track even when everything else is out of sync", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      localTrackUrl: null,
      localIsPlaying: false,
      audioReady: false,
    });
    expect(action.type).toBe("load_track");
  });

  it("does nothing when the room has no track", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      roomTrackUrl: null,
      localTrackUrl: null,
    });
    expect(action).toEqual({ type: "none" });
  });

  it("waits for audio readiness before issuing time commands", () => {
    const action = resolveFollowAction({ ...baseInput(), audioReady: false });
    expect(action).toEqual({ type: "none" });
  });

  it("plays when the host is playing and the guest is paused", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      localIsPlaying: false,
    });
    expect(action).toEqual({ type: "play" });
  });

  it("pauses when the host pauses - even mid-drift", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      roomIsPlaying: false,
      roomPausePositionSec: 25,
      localIsPlaying: true,
      localTimeSec: 30,
    });
    expect(action).toEqual({ type: "pause" });
  });

  it("seeks when playing drift exceeds the threshold", () => {
    const now = Date.now();
    const action = resolveFollowAction(
      { ...baseInput(), localTimeSec: 10 + DRIFT_SEEK_THRESHOLD_SEC * 2 },
      0,
      now,
    );
    expect(action.type).toBe("seek");
  });

  it("ignores drift below the threshold", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      localTimeSec: 10.5,
    });
    expect(action).toEqual({ type: "none" });
  });

  it("throttles corrective seeks but allows big jumps", () => {
    const now = Date.now();
    const lastSeekJustNow = now;

    // Small drift shortly after a previous seek -> throttled.
    const throttled = resolveFollowAction(
      { ...baseInput(), localTimeSec: 10 + DRIFT_SEEK_THRESHOLD_SEC + 0.1 },
      lastSeekJustNow,
      now + 100,
    );
    expect(throttled).toEqual({ type: "none" });

    // After the throttle window small drifts seek again.
    const unthrottled = resolveFollowAction(
      { ...baseInput(), localTimeSec: 10 + DRIFT_SEEK_THRESHOLD_SEC + 0.1 },
      lastSeekJustNow,
      now + MIN_SEEK_INTERVAL_MS + 1,
    );
    expect(unthrottled.type).toBe("seek");

    // Huge drift (tab was suspended) bypasses the throttle entirely.
    const hugeDrift = resolveFollowAction(
      { ...baseInput(), localTimeSec: 10 + 60 },
      lastSeekJustNow,
      now + 100,
    );
    expect(hugeDrift.type).toBe("seek");
  });

  it("snaps to the host's pause position when paused and off-position", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      roomIsPlaying: false,
      localIsPlaying: false,
      roomPausePositionSec: 77,
      localTimeSec: 80,
    });
    expect(action).toEqual({ type: "seek", positionSec: 77 });
  });

  it("holds still at end of track so the host can broadcast the next one", () => {
    // Guest reached the end; target time clamps to duration.
    const action = resolveFollowAction({
      ...baseInput(),
      serverStartTime: Date.now() - 400_000, // long past the 300s track
      localTimeSec: 299.5,
    });
    expect(action).toEqual({ type: "none" });
  });

  it("treats a missing serverStartTime as 'stay at pause position'", () => {
    const action = resolveFollowAction({
      ...baseInput(),
      serverStartTime: undefined,
      localTimeSec: 3,
      roomPausePositionSec: 2.9,
    });
    expect(action).toEqual({ type: "none" });
  });
});

describe("decideSameTrackAction", () => {
  it("pauses when the track is currently playing", () => {
    expect(decideSameTrackAction(true, 30, 300)).toBe("pause");
  });

  it("resumes when paused mid-track", () => {
    expect(decideSameTrackAction(false, 30, 300)).toBe("resume");
  });

  it("restarts when paused at (or near) the very end", () => {
    expect(decideSameTrackAction(false, 299.8, 300)).toBe("restart");
    expect(decideSameTrackAction(false, 300, 300)).toBe("restart");
  });

  it("does not restart when only a little way in", () => {
    expect(decideSameTrackAction(false, 0, 300)).toBe("resume");
  });

  it("resumes safely when duration is unknown", () => {
    expect(decideSameTrackAction(false, 500, 0)).toBe("resume");
  });
});
