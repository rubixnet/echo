import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getFriends = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const friendships = await ctx.db
            .query("friends")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const friendsDetails = await Promise.all(
            friendships.map(async (f) => {
                const friendUser = await ctx.db.get(f.friendId);
                if (!friendUser) return null;

                return {
                    friendshipId: f._id,
                    createdAt: f.createdAt,
                    user: {
                        _id: friendUser._id,
                        name: friendUser.name,
                        username: friendUser.username,
                        avatarUrl: friendUser.avatarUrl,
                        currentTrack: friendUser.currentTrack,
                        activeRoomId: friendUser.activeRoomId,
                    },
                };
            })
        );

        return friendsDetails.filter(
            (f): f is NonNullable<typeof f> => f !== null
        );
    },
});

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