/**
 * Pure decision logic for room playback following.
 *
 * A guest's audio element must mirror the host's state which lives in
 * Convex (isPlaying / serverStartTime / pausePosition / currentTrack).
 * This module turns "room state + local player state" into a single
 * deterministic action, so the React layer stays dumb and the behaviour
 * is fully unit-testable.
 */

export type FollowAction =
  | { type: "none" }
  | { type: "load_track"; url: string }
  | { type: "play" }
  | { type: "pause" }
  | { type: "seek"; positionSec: number };

export interface FollowInput {
  /* Room (host) state */
  roomTrackUrl: string | null;
  roomIsPlaying: boolean;
  /** Where the host was when paused (seconds). */
  roomPausePositionSec: number;
  /** Server timestamp of when the host pressed play. */
  serverStartTime?: number;
  /** Client clock minus server clock, in ms (see delay.calculateServerOffset). */
  serverOffsetMs: number;
  /** Duration of the loaded track on the client (0 if unknown). */
  durationSec: number;

  /* Local player state */
  localTrackUrl: string | null;
  localIsPlaying: boolean;
  localTimeSec: number;
  audioReady: boolean;
}

/** Drift beyond this many seconds triggers a corrective seek while playing. */
export const DRIFT_SEEK_THRESHOLD_SEC = 1.2;
/** While paused, a mismatch larger than this re-seeks to the host position. */
export const PAUSED_SEEK_THRESHOLD_SEC = 0.4;
/** Minimum interval between corrective seeks (anti seek-loop guard). */
export const MIN_SEEK_INTERVAL_MS = 2500;

/**
 * The exact second a follower should be at right now.
 * Mirrors `getPerfectSyncTime` but kept here so decisions are pure.
 */
function computeTargetTime(input: FollowInput): number {
  if (!input.roomIsPlaying || !input.serverStartTime) {
    return Math.max(0, input.roomPausePositionSec || 0);
  }
  const serverNow = Date.now() + input.serverOffsetMs;
  const elapsedSec = Math.max(0, (serverNow - input.serverStartTime) / 1000);
  if (input.durationSec > 0 && elapsedSec >= input.durationSec) {
    return input.durationSec;
  }
  return elapsedSec;
}

/**
 * Decide what clicking the CURRENTLY LOADED track should do.
 * Fixes the classic "song won't play again" bug: a track that finished
 * (or is paused at the very end) restarts from zero instead of toggling
 * into a silent ended state.
 */
export type SameTrackAction = "pause" | "resume" | "restart";

/** Within this many seconds of the end, a paused track counts as finished. */
const END_OF_TRACK_WINDOW_SEC = 1.5;

export function decideSameTrackAction(
  isPlaying: boolean,
  currentTimeSec: number,
  durationSec: number,
): SameTrackAction {
  if (isPlaying) return "pause";
  const nearEnd =
    durationSec > 0 && durationSec - currentTimeSec <= END_OF_TRACK_WINDOW_SEC;
  return nearEnd ? "restart" : "resume";
}

/**
 * Decide what the guest player should do next. Exactly one action or none.
 */
export function resolveFollowAction(
  input: FollowInput,
  lastSeekAtMs: number = 0,
  nowMs: number = Date.now(),
): FollowAction {
  // 1. Wrong track always wins - load it before anything else.
  if (input.roomTrackUrl && input.localTrackUrl !== input.roomTrackUrl) {
    return { type: "load_track", url: input.roomTrackUrl };
  }

  // Nothing to play along to.
  if (!input.roomTrackUrl) return { type: "none" };

  // 2. Wait for the audio element before issuing time-based commands.
  if (!input.audioReady) return { type: "none" };

  // 3. Play / pause must match the room immediately.
  if (input.roomIsPlaying && !input.localIsPlaying) return { type: "play" };
  if (!input.roomIsPlaying && input.localIsPlaying) return { type: "pause" };

  const targetTime = computeTargetTime(input);

  // 4. End-of-track hold: don't fight the player in the final fraction -
  //    the host will broadcast a new track shortly.
  const nearEnd =
    input.durationSec > 0 &&
    targetTime >= input.durationSec - 0.25 &&
    input.localTimeSec >= input.durationSec - 1;

  if (nearEnd) return { type: "none" };

  // 5. Position correction.
  if (input.roomIsPlaying) {
    const drift = Math.abs(input.localTimeSec - targetTime);
    const canSeekNow = nowMs - lastSeekAtMs >= MIN_SEEK_INTERVAL_MS;
    // Big drifts (>4s) bypass the throttle - e.g. after tab suspension.
    if (drift > 4) return { type: "seek", positionSec: targetTime };
    if (drift > DRIFT_SEEK_THRESHOLD_SEC && canSeekNow) {
      return { type: "seek", positionSec: targetTime };
    }
    return { type: "none" };
  }

  // Paused: snap to the host's pause position if we drifted from it.
  if (
    Math.abs(input.localTimeSec - input.roomPausePositionSec) >
    PAUSED_SEEK_THRESHOLD_SEC
  ) {
    return { type: "seek", positionSec: input.roomPausePositionSec };
  }

  return { type: "none" };
}
