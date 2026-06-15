import { v } from "convex/values";
import { mutation, query } from "./_generated/server"

export const getProfile = query({
    args: { workosID: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("workosId", q => q.eq("workosId", args.workosID))
            .unique();
    }
})

export const completedOnboarding = mutation({
    args: {
        userId: v.id("users"),
        genres: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            favoriteGenres: args.genres,
            onboarded: true,
        })

        return { status: "success" }
    }
})

export const createProfile = mutation({
    args: {
        workosId: v.string(),
        email: v.string(),
        name: v.string(), 
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("workosId", (q) => q.eq("workosId", args.workosId))
            .unique();

        if (existingUser) return existingUser;

        return await ctx.db.insert("users", {
            workosId: args.workosId,
            email: args.email,
            name: args.name,
            onboarded: false, 
        });
    }
});

export const finalizeUser = mutation({
    args: {
        workosId: v.string(),
        name: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("workosId", q => q.eq("workosId", args.workosId))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const patchData: any = {
            name: args.name,
            email: args.email,
        }
        return await ctx.db.patch(user._id, patchData);
    }
})