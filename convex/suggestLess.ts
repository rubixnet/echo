import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUserSuggestLessTracks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const dislikes = await ctx.db
      .query("suggestLess")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return dislikes.map((dislike) => dislike.trackId);
  },
});

export const addToUserSuggestLessTracks = mutation({
  args: {
    userId: v.id("users"),
    trackId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("suggestLess", {
      userId: args.userId,
      trackId: args.trackId,
      dislikedAt: Date.now(),
    });
  },
});

export const suggestLessTracks = mutation({
  args: {
    userId: v.id("users"),
    trackId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("suggestLess")
      .withIndex("by_user_and_track", (q) =>
        q.eq("userId", args.userId).eq("trackId", args.trackId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { disliked: false };
    } else {
      await ctx.db.insert("suggestLess", {
        userId: args.userId,
        trackId: args.trackId,
        dislikedAt: Date.now(),
      });
      return { disliked: true };
    }
  },
});
