import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    workosId: v.string(),
    onboarded: v.optional(v.boolean()),
    favoriteGenres: v.optional(v.array(v.string())),
  }).index("workosId", ["workosId"]),

  tracks: defineTable({
    title: v.string(),
    artist: v.string(),
    duration: v.optional(v.string()),
    source: v.string(),
    youtubeId: v.optional(v.string()),
    audioUrl: v.string(),
    coverUrl: v.string(),
  }).index("by_youtubeId", ["youtubeId"])
    .searchIndex("search_title", { searchField: "title" }),


  history: defineTable({
    userId: v.id("users"), 
    trackId: v.id("tracks"), 
    title: v.string(), 
    artist: v.string(), 
    coverUrl: v.string(), 
    duration: v.optional(v.string()), 
    audioUrl: v.string(),
    playedAt: v.number(),  
  }).index("by_user", ["userId"])
  .index("by_user_and_track", ["userId", "trackId"]),
  
  likedSongs: defineTable({
    userId: v.id("users"),
    trackId: v.id("tracks"),
    likedAt: v.number(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.string(),
    audioUrl: v.string(),
  }).index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),


  searchHistory: defineTable({
    userId: v.id("users"),
    searchQuery: v.string(),
    searchedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_and_query", ["userId", "searchQuery"]),

  rooms: defineTable({
    name: v.string(),
    hostId: v.id("users"),
    currentTrackId: v.optional(v.id("tracks")),
    isPlaying: v.boolean(),
    serverStartTime: v.optional(v.number()),
    pausePosition: v.number(),
    listeners: v.array(v.id("users")),
    isPublic: v.boolean(),
    lastActiveAt: v.number(),
  }),

  playlists: defineTable({
    name: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  playlistTracks: defineTable({
    playlistId: v.id('playlists'),
    trackId: v.id('tracks'),
    addedAt: v.number(),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_playlist_and_track", ["playlistId", "trackId"])
});