import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const ensureYoutubeTrack = mutation({
    args: {
        youtubeId: v.string(),
        title: v.string(),
        artist: v.string(),
        audioUrl: v.string(),
        coverUrl: v.string(),
        duration: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = = await ctx.db
            .query("tracks")
            .withIndex("by_youtubeId", (q) => q.eq("youtubeId", args.youtubeId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { audioUrl: args.audioUrl })
            return existing._id;
        }
        return await ctx.db.insert("tracks", {
            title: args.title,
            artist: args.artist,
            duration: args.duration,
            audioUrl: args.audioUrl,
            coverUrl: args.coverUrl,
            source: "youtube",
            youtubeId: args.youtubeId,
        });
    },
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
            source: source, 
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