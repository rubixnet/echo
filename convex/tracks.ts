import { mutation } from "./_generated/server";
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
    track: v.object(trackArgs),
  },
  handler: async (ctx, args) => {
    const { userId, track } = args;

    await ctx.db.patch(userId, {
      currentTrack: track,
    });

    return await ctx.db.get(userId);
  },
});