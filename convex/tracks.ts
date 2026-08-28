import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const ensureYoutubeTrack = mutation({
  args: {
    trackId: v.string(),
    title: v.string(),
    artist: v.string(),
    audioUrl: v.string(),
    coverUrl: v.optional(v.string()),
    duration: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tracks")
      .withIndex("by_trackId", (q) => q.eq("trackId", args.trackId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { audioUrl: args.audioUrl });
      return existing._id;
    }
    return await ctx.db.insert("tracks", {
      title: args.title,
      artist: args.artist,
      duration: args.duration,
      audioUrl: args.audioUrl,
      coverUrl:
        args.coverUrl ||
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop",
      source: "youtube",
      trackId: args.trackId,
    });
  },
});

export const getCombinedUserExclusions = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return []

    const [neverShow, suggestLess, sessionHistory] = await Promise.all([
      ctx.db
        .query("neverShowAgain")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect(),
      ctx.db
        .query("suggestLess")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect(),
      ctx.db
        .query("relatedTracksData")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .first(),
    ]);


    const hatedIds = neverShow.map((item) => item.trackId);
    const dislikeIds = suggestLess.map((item) => item.trackId);
    const sessionIds = Array.isArray(sessionHistory?.data) ? sessionHistory.data : [];

    console.log(hatedIds, dislikeIds, sessionIds);

    return Array.from(new Set([...hatedIds, ...dislikeIds, ...sessionIds]));
  },
});

export const updateTrackSessionHistory = mutation({
  args: {
    userId: v.id("users"),
    trackId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("relatedTracksData")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      const currentList: string[] = Array.isArray(existing.data) ? existing.data : [];
      if (!currentList.includes(args.trackId)) {
        currentList.push(args.trackId);
        await ctx.db.patch(existing._id, {
          data: currentList.slice(-100),
          updatedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("relatedTracksData", {
        userId: args.userId,
        data: [args.trackId],
        updatedAt: Date.now(),
      });
    }
  },
});

export const cleanupStaleSessions = mutation({
  handler: async (ctx) => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const staleRecords = await ctx.db
      .query("relatedTracksData")
      .filter((q) => q.lt(q.field("updatedAt"), twoHoursAgo))
      .collect();

    for (const record of staleRecords) {
      await ctx.db.delete(record._id);
    }
  },
});

const trackArgs = {
  title: v.string(),
  artist: v.string(),
  coverUrl: v.string(),
  trackId: v.string(),
  duration: v.string(),
};

export const updateCurrentTrack = mutation({
  args: {
    userId: v.id("users"),
    track: v.optional(v.object(trackArgs)),
  },
  handler: async (ctx, args) => {
    const { userId, track } = args;

    await ctx.db.patch(userId, {
      currentTrack: track,
    });

    return await ctx.db.get(userId);
  },
});