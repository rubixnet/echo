import { cronJobs } from "convex/server";
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval("clear-expired-rooms", 
    { minutes: 1 }, 
    internal.rooms.clearExpiredRooms 
)

export default crons;