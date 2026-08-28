import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return history.sort((a, b) => b.playedAt - a.playedAt);
  },
});

export const addToHistory = mutation({
  args: { userId: v.id("users"), trackId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("history")
      .withIndex("by_user_and_track", (q) =>
        q.eq("userId", args.userId).eq("trackId", args.trackId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { playedAt: Date.now() });
      return;
    }

    let track = null;

    const validConvexId = ctx.db.normalizeId("tracks", args.trackId);

    if (validConvexId) {
      track = await ctx.db.get(validConvexId);
    } else {
      track = await ctx.db
        .query("tracks")
        .withIndex("by_trackId", (q) => q.eq("trackId", args.trackId))
        .first();
    }

    if (!track) throw new Error("Track not found");

    await ctx.db.insert("history", {
      userId: args.userId,
      trackId: args.trackId,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      duration: track.duration,
      audioUrl: track.audioUrl,
      playedAt: Date.now(),
    });
  },
});

export const removeHistoryItem = mutation({
  args: { historyId: v.id("history") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.historyId);
  },
});

export const clearSongsHistory = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const songsHistory = await ctx.db
      .query("history")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    await Promise.all(songsHistory.map((song) => ctx.db.delete(song._id)));
  },
});
