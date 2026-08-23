import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    displayName: v.optional(v.string()),
    email: v.string(),
    workosId: v.string(),
    activeRoomId: v.optional(v.id("rooms")),
    onboarded: v.optional(v.boolean()),
    avatarUrl: v.optional(v.string()),
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
  })
    .index("by_youtubeId", ["youtubeId"])
    .searchIndex("search_title", { searchField: "title" }),

  history: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    source: v.optional(
      v.object({
        type: v.string(),
        name: v.optional(v.string()),
      }),
    ),
    playedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),

  suggestLess: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    dislikedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),

  neverShowAgain: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    hatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),

  likedSongs: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    likedAt: v.number(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.string(),
    audioUrl: v.optional(v.string()),
    source: v.optional(
      v.object({
        type: v.string(),
        name: v.optional(v.string()),
      }),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),

  categories: defineTable({
    categoryId: v.string(),
    name: v.string(),
    playlistId: v.string(),
    type: v.string(),
    updatedAt: v.number(),
  }).index("by_categoryId", ["categoryId"]),

  category_tracks: defineTable({
    categoryId: v.string(),
    youtubeId: v.string(),
    title: v.string(),
    artist: v.string(),
    thumbnail: v.string(),
    duration: v.string(),
    order: v.number(),
  }).index("by_category", ["categoryId"]),

  searchHistory: defineTable({
    userId: v.id("users"),
    searchQuery: v.string(),
    searchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_query", ["userId", "searchQuery"]),

  rooms: defineTable({
    name: v.string(),
    hostId: v.id("users"),
    currentTrackId: v.optional(v.string()),
    isPlaying: v.boolean(),
    serverStartTime: v.optional(v.number()),
    pausePosition: v.number(),
    listeners: v.array(v.id("users")),
    isPublic: v.boolean(),
    lastActiveAt: v.number(),
    lastEvent: v.optional(
      v.object({
        type: v.string(),
        at: v.number(),
        byUserId: v.optional(v.id("users")),
      }),
    ),
  }),

  playlists: defineTable({
    name: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    isPinned: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  libraryTracks: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    source: v.optional(
      v.object({
        type: v.string(),
        name: v.optional(v.string()),
      }),
    ),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),

  libraryItems: defineTable({
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        duration: v.optional(v.string()),
        audioUrl: v.optional(v.string()),
        source: v.optional(
          v.object({
            type: v.string(),
            name: v.optional(v.string()),
          }),
        ),
      }),
    ),
    savedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "itemType"])
    .index("by_user_and_item", ["userId", "itemType", "itemId"]),

  playlistTracks: defineTable({
    playlistId: v.id("playlists"),
    trackId: v.string(),
    title: v.optional(v.string()),
    artist: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    duration: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    source: v.optional(
      v.object({
        type: v.string(),
        name: v.optional(v.string()),
      }),
    ),
    addedAt: v.number(),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_playlist_and_track", ["playlistId", "trackId"]),
});
