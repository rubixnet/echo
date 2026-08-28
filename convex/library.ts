import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getLibraryItems = query({
  args: {
    userId: v.id("users"),
    itemType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.itemType && args.itemType !== "all") {
      const targetType = args.itemType;
      return await ctx.db
        .query("libraryItems")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", args.userId).eq("itemType", targetType),
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("libraryItems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getUserLibrary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("libraryItems")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("itemType", "track"),
      )
      .order("desc")
      .collect();

    return items.map((item) => ({
      _id: item._id,
      userId: item.userId,
      trackId: item.itemId,
      id: item.itemId,
      title: item.title,
      artist: item.subtitle || "Unknown Artist",
      coverUrl: item.coverUrl || "",
      duration: item.metadata?.duration,
      audioUrl: item.metadata?.audioUrl,
      source: item.metadata?.source,
      savedAt: item.savedAt,
    }));
  },
});

export const checkSaved = query({
  args: {
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("libraryItems")
      .withIndex("by_user_and_item", (q) =>
        q
          .eq("userId", args.userId)
          .eq("itemType", args.itemType)
          .eq("itemId", args.itemId),
      )
      .first();

    return !!existing;
  },
});

export const toggleSaveItem = mutation({
  args: {
    userId: v.id("users"),
    itemType: v.string(),
    itemId: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("libraryItems")
      .withIndex("by_user_and_item", (q) =>
        q
          .eq("userId", args.userId)
          .eq("itemType", args.itemType)
          .eq("itemId", args.itemId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    } else {
      await ctx.db.insert("libraryItems", {
        userId: args.userId,
        itemType: args.itemType,
        itemId: args.itemId,
        title: args.title,
        subtitle: args.subtitle,
        coverUrl: args.coverUrl,
        metadata: args.metadata,
        savedAt: Date.now(),
      });
      return { saved: true };
    }
  },
});
