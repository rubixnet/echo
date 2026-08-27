import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getFriends = query({
    args: {
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const friends = await ctx.db
            .query("friends")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        return friends;

    }
})

export const toggleFriend = mutation({
    args: {
        userId: v.id("users"),
        friendId: v.id("users")
    },
    handler: async (ctx, args) => {
        const friend = await ctx.db
            .query("friends")
            .withIndex("by_user_and_friend", (q) =>
                q.eq("userId", args.userId).eq("friendId", args.friendId)
            )
            .first();
        if (friend) {
            await ctx.db.delete(friend._id);
        } else {
            await ctx.db.insert("friends", {
                userId: args.userId,
                friendId: args.friendId,
                createdAt: Date.now(),
            });
        }
    }
})