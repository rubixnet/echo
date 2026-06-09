import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const saveTrack = mutation({
    args: {
        title: v.string(),
        artist: v.string(),
        storageId: v.id("_storage"),
        coverUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const audioUrl = await ctx.storage.getUrl(args.storageId);
        if (!audioUrl) throw new Error("failed to get audio url")
        await ctx.db.insert("tracks", {
            title: args.title,
            duration: "0:00", 
            artist: args.artist,
            audioUrl: audioUrl,
            coverUrl: args.coverUrl,
        })
    }
})

export const getRecommended = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tracks").take(10);
    },
})

export const search = query({
    args: { searchQuery: v.string() },
    handler: async (ctx, args) => {
        if (args.searchQuery === "") {
            return await ctx.db.query("tracks").order("desc").take(10);
        }
        return await ctx.db
            .query("tracks")
            .withSearchIndex("search_title", (q) =>
                q.search("title", args.searchQuery)
            )
            .take(20);
    },
});