import { mutation, query } from "./_generated/server"
import { v } from "convex/values";

export const getRecent = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("searchHistory")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(10);
    }
})

export const saveSearch = mutation({
    args: {
        userId: v.id('users'),
        searchQuery: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("searchHistory")
            .withIndex("by_user_and_query", (q) => q.eq("userId", args.userId).eq('searchQuery', args.searchQuery))
            .first()

        if (existing) {
            await ctx.db.patch(existing._id, { searchedAt: Date.now() })
        } else {
            await ctx.db.insert("searchHistory", {
                userId: args.userId,
                searchQuery: args.searchQuery,
                searchedAt: Date.now(),
            })

            const allSearches = await ctx.db
                .query("searchHistory")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .collect()

            allSearches.sort((a, b) => b.searchedAt - a.searchedAt)

            if (allSearches.length > 10) {
                const additionalSearches = allSearches.slice(10)
                await Promise.all(additionalSearches.map((search) => ctx.db.delete(search._id)))
            }
        }

    }
})

export const clearSearchHistory = mutation({
    args: {
        userId: v.id('users'),
    },
    handler: async (ctx, args) => {
        const userSearches = await ctx.db
            .query("searchHistory")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect()

        await Promise.all(userSearches.map((search) => ctx.db.delete(search._id)))
    }
})