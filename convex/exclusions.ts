import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserExclusionIds = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (!args.userId) return [];

        const record = await ctx.db
            .query("userExclusions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .unique();

        return record ? record.trackIds : [];
    },
});

export const addTrackToExclusions = mutation({
    args: {
        userId: v.id("users"),
        trackId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("userExclusions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .unique();

        const currentTime = Date.now();
        
        if (existing) {
            if (!existing.trackIds.includes(args.trackId)) {
                await ctx.db.patch(existing._id, {
                    trackIds: [...existing.trackIds, args.trackId],
                    updatedAt: currentTime,
                });
            }
        } else {
            await ctx.db.insert("userExclusions", {
                userId: args.userId,
                trackIds: [args.trackId],
                updatedAt: currentTime,
            });
        }
    },
});