import { query } from "./_generated/server"
import { v } from "convex/values"

export const getRecommended = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tracks").take(10);
    },
})

export const search = query({
    args: {
        searchQuery: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.searchQuery) return [];

        const allTracks = await ctx.db.query("tracks").collect();

        return allTracks.filter(track =>
            track.title.toLowerCase().includes(args.searchQuery.toLowerCase()) ||
            track.artist.toLowerCase().includes(args.searchQuery.toLowerCase())
        );
    },
});