import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProfile = query({
  args: {
    workosId: v.string()
  },
  handler: async (ctx, args) => {
    const id = args.workosId
    if (!id) return null;

    return await ctx.db
      .query("users")
      .withIndex("workosId", (q) => q.eq("workosId", id))
      .unique();
  },
});

export const updatePrivacySettings = mutation({
  args: {
    userId: v.id("users"),
    showOnlineStatus: v.optional(v.boolean()),
    showCurrentTrack: v.optional(v.boolean()),
    showPlaylists: v.optional(v.boolean()),
    showLikedSongs: v.optional(v.boolean()),
    showActiveRoom: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...privacyFields } = args;
    await ctx.db.patch(userId, privacyFields);
  },
});


export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) {
      return [];
    }
    return await ctx.db
      .query("users")
      .withSearchIndex("search_username", (q) =>
        q.search("username", args.query)
      )
      .take(5);
  },
});

export const updateGenrePreferences = mutation({
  args: {
    userId: v.id("users"),
    genres: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch("users", args.userId, {
      favoriteGenres: args.genres,
    });
  },
});

export const getUserData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_id", (q) => q.eq("_id", args.userId))
      .unique();
  },
});

export const updateUserData = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    favoriteGenres: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, ...fields } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const patchFields = { ...fields, onboarded: true };

    await ctx.db.patch(userId, patchFields);
    return await ctx.db.get(userId);
  },
});

export const createProfile = mutation({
  args: {
    workosId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("workosId", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (existingUser) {
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      workosId: args.workosId,
      username: args.name || undefined,
      email: args.email,
      name: args.name || "",
      onboarded: false,
    });

    const newUser = await ctx.db.get(userId);
    if (!newUser) {
      throw new Error("Failed to fetch newly created user");
    }

    return newUser;
  },
});

export const finalizeUser = mutation({
  args: {
    workosId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("workosId", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.patch(user._id, {
      name: args.name,
      email: args.email,
    });
  },
});

export const heartbeat = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeen: Date.now()
    })
  }
})