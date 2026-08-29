import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const ONLINE_THRESHOLD_MS = 60 * 1000;

export const getFriendsData = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const friendships = await ctx.db
            .query("friends")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const now = Date.now();

        const friends = await Promise.all(
            friendships.map(async (f) => {
                const friend = await ctx.db.get(f.friendId);
                if (!friend) return null;


                const userPlaylists = await ctx.db
                    .query("playlists")
                    .withIndex("by_user", (q) => q.eq("userId", friend._id))
                    .collect();

                const isOnline = Boolean(
                    friend.lastSeen && now - friend.lastSeen < ONLINE_THRESHOLD_MS
                );

                return {
                    _id: friend._id,
                    username: friend.username || friend.name || "User",
                    isOnline,
                    currentTrack: friend.currentTrack ?? null,
                    playlistCount: userPlaylists.length,
                };
            })
        );

        return friends.filter((item): item is NonNullable<typeof item> => item !== null);
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