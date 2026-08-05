import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const checkLiked = query({
    args: {
        userId: v.id("users"),
        trackId: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.trackId) return false;
        const like = await ctx.db
            .query("likedSongs")
            .withIndex("by_user_and_track", (q) =>
                q.eq("userId", args.userId).eq("trackId", args.trackId)
            )
            .first();
        return !!like;
    }
});

export const toggleLike = mutation({
    args: {
        userId: v.id("users"),
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
            })
        ),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("likedSongs")
            .withIndex("by_user_and_track", (q) =>
                q.eq("userId", args.userId).eq("trackId", args.trackId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { status: "unliked" };
        } else {
            await ctx.db.insert("likedSongs", {
                userId: args.userId,
                trackId: args.trackId,
                likedAt: Date.now(),
                title: args.title || "Unknown Track",
                artist: args.artist || "Unknown Artist",
                coverUrl: args.coverUrl || "",
                duration: args.duration || "0:00",
                audioUrl: args.audioUrl || `/api/youtube/stream?id=${args.trackId}`,
                source: args.source || { type: "liked" },
            });
            return { status: "liked" };
        }
    }
});

export const getMyLikes = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("likedSongs")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    }
});