import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(), 
        email: v.string(), 
        workosId: v.string(), 
    }).index("workosId", ["workosId"]),

    tracks: defineTable({
        title: v.string(), 
        artist: v.string(), 
        duration: v.string(), 
        audioUrl: v.string(), 
        coverUrl: v.string(), 
    }), 

    likedSongs: defineTable({
        userId: v.id("users"), 
        trackId: v.id("tracks"), 
        likedAt: v.number()
    }).index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]), 

    rooms: defineTable({
        name: v.string(), 
        hostId: v.id("users"), 
        currentTrackId: v.optional(v.id("tracks")), 
        isPlaying: v.boolean(), 
        serverStartTime: v.optional(v.number()), 
        pausePosition: v.number(), 
        listeners: v.array(v.id('users')), 
        isPublic: v.boolean(),
    })
})