import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const toggleLike = mutation({
    args: { trackId: v.id("tracks") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) throw new Error("Not logged in");

        const user = await ctx.db
            .query("users")
            .withIndex("workosId", (q) => q.eq("workosId", identity.subject))
            .unique();

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
            await ctx.db.insert("likedSongs", {
                userId: user._id,
                trackId: args.trackId,
                likedAt: Date.now(),
            });
            return { status: "liked" };
        }
    }
})

export const getMyLikes = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("workosId", (q) => q.eq("workosId", identity.subject))
            .unique();

        if (!user) return [];

        const likes = await ctx.db
            .query("likedSongs")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        const tracks = await Promise.all(
            likes.map(async (like) => {
                return await ctx.db.get(like.trackId);
            })
        );

        return tracks.filter(Boolean);
    },
});