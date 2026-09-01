import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

interface FriendPlaylist {
    _id: Id<"playlists">;
    name: string;
    trackCount: number;
    coverUrl: string | null;
}

export const toggleFriend = mutation({
    args: { userId: v.id("users"), friendId: v.id("users") },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("friends")
            .withIndex("by_user_and_friend", (q) =>
                q.eq("userId", args.userId).eq("friendId", args.friendId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { status: "removed" };
        }

        await ctx.db.insert("friends", {
            userId: args.userId,
            friendId: args.friendId,
            createdAt: Date.now(),
        });
        return { status: "added" };
    },
});

export const getFriendsData = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const friendRelations = await ctx.db
            .query("friends")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const results = await Promise.all(
            friendRelations.map(async (rel) => {
                const friend = await ctx.db.get(rel.friendId);
                if (!friend) return null;

                const isOnline =
                    friend.showOnlineStatus !== false &&
                    friend.lastSeen &&
                    Date.now() - friend.lastSeen < 1000 * 60 * 3;

                const activeRoom =
                    friend.showActiveRoom !== false && friend.activeRoomId
                        ? await ctx.db.get(friend.activeRoomId)
                        : null;

                let playlists: FriendPlaylist[] = [];
                if (friend.showPlaylists !== false) {
                    const rawPlaylists = await ctx.db
                        .query("playlists")
                        .withIndex("by_user", (q) => q.eq("userId", friend._id))
                        .filter((q) => q.neq(q.field("isPublic"), false))
                        .collect();

                    playlists = await Promise.all(
                        rawPlaylists.map(async (p) => {
                            const tracks = await ctx.db
                                .query("playlistTracks")
                                .withIndex("by_playlist", (q) => q.eq("playlistId", p._id))
                                .collect();
                            return {
                                _id: p._id,
                                name: p.name,
                                trackCount: tracks.length,
                                coverUrl: tracks[0]?.coverUrl || null,
                            };
                        })
                    );
                }

                let likedSongsCount: number | null = null;
                if (friend.showLikedSongs === true) {
                    const likedTracks = await ctx.db
                        .query("likedSongs")
                        .withIndex("by_user", (q) => q.eq("userId", friend._id))
                        .collect();
                    likedSongsCount = likedTracks.length;
                }

                return {
                    _id: friend._id,
                    username: friend.username || friend.name || "User",
                    name: friend.name,
                    isOnline: !!isOnline,
                    currentTrack:
                        friend.showCurrentTrack !== false ? friend.currentTrack : undefined,
                    activeRoomId: activeRoom ? activeRoom._id : null,
                    activeRoomName: activeRoom?.name || null,
                    playlists,
                    playlistCount: playlists.length,
                    likedSongsCount,
                };
            })
        );

        return results.filter(Boolean) as Array<
            NonNullable<(typeof results)[number]>
        >;
    },
});