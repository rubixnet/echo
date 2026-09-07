import { query } from "./_generated/server";

export const getActiveBanner = query({
  args: {},
  handler: async (ctx) => {
    const banners = await ctx.db
      .query("bannerInfo")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .take(1);

    return banners[0] ?? null;
  },
});