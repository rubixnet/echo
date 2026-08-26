import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserHatedTracks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const hated = await ctx.db
      .query("neverShowAgain")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return hated.map((hated) => hated.trackId);
  },
});

export const addToNeverShowAgainTracks = mutation({
  args: {
    userId: v.id("users"),
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    coverUrl: v.string(),
    duration: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("neverShowAgain", {
      userId: args.userId,
      trackId: args.trackId,
      hatedAt: Date.now(),
      title: args.title,
      artist: args.artist,
      coverUrl: args.coverUrl,
      duration: args.duration,
    });
  },
});

export const removeFromNeverShowAgainTracks = mutation({
  args: {
    userId: v.id("users"),
    trackId: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("neverShowAgain")
      .withIndex("by_user_and_track", (q) =>
        q.eq("userId", args.userId).eq("trackId", args.trackId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      return { neverShowAgain: false };
    }
  }
})