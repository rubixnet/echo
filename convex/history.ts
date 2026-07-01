import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getHistory = query({
    args: { userId: v.id('users'), },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('history')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .order('desc')
            .collect()
    }
})

export const addToHistory = mutation({
    args: { userId: v.id('users'), trackId: v.id('tracks') },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('history')
            .withIndex("by_user_and_track", (q) => q.eq('userId', args.userId).eq('trackId', args.trackId))
            .first()

        if (existing) {
            await ctx.db.patch(existing._id, { playedAt: Date.now() })
        } else {
            const track = await ctx.db.get(args.trackId)
            if (!track) throw new Error('Track not found')

            await ctx.db.insert('history', {
                userId: args.userId,
                trackId: args.trackId,
                title: track.title,
                artist: track.artist,
                coverUrl: track.coverUrl,
                duration: track.duration,
                audioUrl: track.audioUrl,
                playedAt: Date.now(),
            })
        }

        const searchHisotry = await ctx.db
            .query('history')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect()

        searchHisotry.sort((a, b) => b.playedAt - a.playedAt)
    }
})

export const clearSongsHistory = mutation({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {

        const songsHistory = await ctx.db
            .query('history')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect()

        await Promise.all(songsHistory.map((song) => ctx.db.delete(song._id)))
    }
})