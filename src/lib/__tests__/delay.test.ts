import { describe, it, expect } from "vitest";
import { calculateServerOffset, getPerfectSyncTime } from "../delay";

describe("calculateServerOffset", () => {
  it("returns ~0 when clocks are aligned and latency is symmetric", () => {
    const t = 1_000_000;
    const offset = calculateServerOffset(t - 100, t, t + 100);
    expect(offset).toBe(0);
  });

  it("is positive when the server clock is ahead of the client", () => {
    // Client sends at 0ms; server says 500ms; reply arrives at 200ms.
    const offset = calculateServerOffset(0, 500, 200);
    // rtt=200 -> latency=100 -> offset = 500 - (0 + 100) = 400
    expect(offset).toBe(400);
  });

  it("is negative when the server clock is behind the client", () => {
    const offset = calculateServerOffset(1000, 900, 1100);
    // rtt=100 -> latency=50 -> offset = 900 - 1050 = -150
    expect(offset).toBe(-150);
  });

  it("handles asymmetric latency by using half the RTT", () => {
    const offset = calculateServerOffset(0, 0, 400);
    expect(offset).toBe(-200);
  });
});

describe("getPerfectSyncTime", () => {
  it("returns the pause position when paused", () => {
    expect(getPerfectSyncTime(undefined, 42.5, false, 0)).toBe(42.5);
  });

  it("returns pause position even when serverStartTime exists but paused", () => {
    expect(getPerfectSyncTime(Date.now(), 10, false, 0)).toBe(10);
  });

  it("never returns a negative position", () => {
    expect(getPerfectSyncTime(undefined, -5, false, 0)).toBe(0);
  });

  it("computes elapsed playback time from the server start clock", () => {
    const now = Date.now();
    const startedFiveSecAgo = now - 5_000;
    // offset 0: client clock == server clock
    const time = getPerfectSyncTime(startedFiveSecAgo, 0, true, 0);
    expect(time).toBeGreaterThanOrEqual(4.9);
    expect(time).toBeLessThanOrEqual(5.5);
  });

  it("applies the server offset when the client clock is skewed", () => {
    const now = Date.now();
    // Server is 60s ahead of this client.
    const serverNow = now + 60_000;
    const serverStartedAt = serverNow - 3_000;
    const time = getPerfectSyncTime(serverStartedAt, 0, true, 60_000);
    expect(time).toBeGreaterThanOrEqual(2.9);
    expect(time).toBeLessThanOrEqual(3.5);
  });

  it("clamps to duration when playback has run past the end", () => {
    const now = Date.now();
    const startedLongAgo = now - 10 * 60 * 1000;
    expect(getPerfectSyncTime(startedLongAgo, 0, true, 0, 180)).toBe(180);
  });
});
