import { cronJobs } from "convex/server";
import { internal } from "./_generated/api"
import { api } from "./_generated/api";

const crons = cronJobs()

// crons.interval("clear-expired-rooms", 
//     { minutes: 1 }, 
//     internal.rooms.clearExpiredRooms 
// ) removing for now becaues it's buggy! 


crons.interval(
  "sync-youtube-playlists",
  { hours: 12 },
  api.playlists.syncAllPlaylists
);

export default crons;