import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "clear-stale-sessions",
  { hours: 2 },
  api.tracks.cleanupStaleSessions,
)

crons.interval(
  "clear-expired-rooms",
  { minutes: 1 },
  internal.rooms.clearExpiredRooms,
);

crons.interval(
  "sync-daily-charts",
  { hours: 24 },
  internal.syncPlaylists.syncPlaylistsByFrequency,
  { frequency: "daily" },
);

crons.interval(
  "sync-weekly-genres",
  { hours: 168 },
  internal.syncPlaylists.syncPlaylistsByFrequency,
  { frequency: "weekly" },
);

export default crons;
