import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const trackSchema = v.object({
  title: v.string(),
  trackId: v.string(),
  coverUrl: v.string(),
  artist: v.string(),
  duration: v.optional(v.string()),
});

export default defineSchema({
  users: defineTable({
    name: v.string(),
    username: v.optional((v.string())),
    email: v.string(),
    workosId: v.string(),
    activeRoomId: v.optional(v.id("rooms")),
    onboarded: (v.boolean()),
    lastSeen: v.optional((v.number())),
    favoriteGenres: v.optional(v.array(v.string())),
    currentTrack: v.optional(trackSchema),
  })
    .index("workosId", ["workosId"])
    .searchIndex("search_username", {
      searchField: "username",
    }),

  tracks: defineTable({
    title: v.string(),
    artist: v.string(),
    duration: v.optional(v.string()),
    source: v.string(),
    trackId: v.string(),
    audioUrl: v.string(),
    coverUrl: v.string(),
  })
    .index("by_trackId", ["trackId"])
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
    playCount: v.optional(v.number()),
    skipCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"])
    .index("by_user_and_playedAt", ["userId", "playedAt"])
    .index("by_user_and_playCount", ["userId", "playCount"]),

  friends: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_and_friend", ["userId", "friendId"]),

  suggestLess: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    dislikedAt: v.number(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_track", ["userId", "trackId"]),

  neverShowAgain: defineTable({
    userId: v.id("users"),
    trackId: v.string(),
    hatedAt: v.number(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.string(),
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
    trackId: v.string(),
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


  relatedTracksData: defineTable({
    userId: v.id("users"),
    updatedAt: v.number(),
    data: v.any(),
  })
    .index("by_user", ["userId"])
    .index("by_updatedAt", ["updatedAt"]),

  userExclusions: defineTable({
    userId: v.id("users"),
    trackIds: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

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
