import { v } from "convex/values";
import { mutation, query } from "./_generated/server"

export const toggleLike = mutation({
    args: {
        userId: v.optional(v.id("users")),
        trackId: v.id("tracks"),
    },
    handler: async (ctx, args) => {
        let user = args.userId ? await ctx.db.get(args.userId) : null;

        if (!user) {
            const identity = await ctx.auth.getUserIdentity();
            if (!identity) throw new Error("Not logged in");

            user = await ctx.db
                .query("users")
                .withIndex("workosId", (q) => q.eq("workosId", identity.subject))
                .unique();
        }

        if (!user) throw new Error("User not found");

        const existingLike = await ctx.db
            .query("likedSongs")
            .withIndex("by_user_and_track", (q) =>
                q.eq("userId", user._id).eq("trackId", args.trackId)
            )
            .unique();

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
            return { status: "unliked" };
        } else {
            const track = await ctx.db.get(args.trackId);
            if (!track) throw new Error("Track not found");

            await ctx.db.insert("likedSongs", {
                userId: user._id,
                trackId: args.trackId,
                likedAt: Date.now(),
                title: track.title,
                artist: track.artist,
                coverUrl: track.coverUrl,
                duration: track.duration || "0:00",
                audioUrl: track.audioUrl,
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