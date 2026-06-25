import { v } from "convex/values";
import { mutation, query } from "./_generated/server"

export const createPlaylist = mutation({
    args: {
        name: v.string(),
        userId: v.id('users')
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("playlists", {
            name: args.name,
            userId: args.userId,
            createdAt: Date.now()
        })
    }
})

export const getUserPlaylists = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("playlists")
            .withIndex("by_user", (q) => q.eq('userId', args.userId))
            .order("desc")
            .collect()
    }
})

export const addTrack = mutation({
    args: {
        playlistId: v.id('playlists'),
        trackId: v.id('tracks')
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("playlistTracks")
            .withIndex("by_playlist_and_track", (q) =>
                q.eq("playlistId", args.playlistId).eq("trackId", args.trackId)
            )
            .first();

        if (existing) return { success: false, message: "Track already exists in playlist" };

        await ctx.db.insert("playlistTracks", {
            playlistId: args.playlistId,
            trackId: args.trackId,
            addedAt: Date.now(),
        })

        return { success: true, message: "Added to playlist" }
    }
})

export const removeFromPlaylist = mutation({
    args: {
        playlistId: v.id('playlists'),
        trackId: v.id('tracks')
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("playlistTracks")
            .withIndex("by_playlist_and_track", (q) =>
                q.eq("playlistId", args.playlistId).eq("trackId", args.trackId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id)
            return { success: true, message: "Removed from playlist" }
        } else {
            return { success: false, message: "Track not found in playlist" }
        }
    }
})

export const getPlaylistTracks = query({
    args: { playlistId: v.id('playlists') },
    handler: async (ctx, args) => {
        const relations = await ctx.db
            .query("playlistTracks")
            .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
            .order("desc") // this manages order of tracks **
            .collect()

        const tracks = await Promise.all(
            relations.map(async (relation) => {
                const track = await ctx.db.get(relation.trackId);
                return track;
            })
        )
        return tracks.filter((track) => track !== undefined);
    }
})

export const deletePlaylist = mutation({
    args: {
        playlistId: v.id('playlists'),
        userId: v.id('users')
    },
    handler: async (ctx, args) => {
        const playlist = await ctx.db.get(args.playlistId)

        if (!playlist || playlist.userId !== args.userId) {
            throw new Error("unauthorized")
        }

        const tracks = await ctx.db
            .query("playlistTracks")
            .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
            .collect()

        for (const track of tracks) {
            await ctx.db.delete(track._id)
        }

        ctx.db.delete(args.playlistId)
    }
})