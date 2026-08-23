import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Rooms whose host stopped sending heartbeats are torn down and every
// member's activeRoomId pointer is cleared (see rooms.clearExpiredRooms).
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
