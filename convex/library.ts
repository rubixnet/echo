import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserLibrary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("libraryTracks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc") 
      .collect();
  },
});

export const checkSaved = query({
  args: { userId: v.id("users"), trackId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("libraryTracks")
      .withIndex("by_user_and_track", (q) =>
        q.eq("userId", args.userId).eq("trackId", args.trackId)
      )
      .first();
    return !!existing;
  },
});

export const saveTrack = mutation({
  args: {
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("libraryTracks")
      .withIndex("by_user_and_track", (q) =>
        q.eq("userId", args.userId).eq("trackId", args.trackId)
      )
      .first();

    if (existing) return { success: false, message: "Already in library" };

    const { userId, ...trackData } = args;

    await ctx.db.insert("libraryTracks", {
      userId,
      ...trackData,
      savedAt: Date.now(),
    });

    return { success: true };
  },
});

export const removeTrack = mutation({
  args: {
    userId: v.id("users"),
    trackId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("libraryTracks")
      .withIndex("by_user_and_track", (q) =>
        q.eq("userId", args.userId).eq("trackId", args.trackId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});