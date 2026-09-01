import { mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const migrateYoutubeIdToTrackId = mutation({
  args: {},
  handler: async (ctx) => {
    let categoryTracksCount = 0;
    let tracksCount = 0;

    const categoryTracks = await ctx.db.query("category_tracks").collect();
    for (const doc of categoryTracks) {
      const rawDoc = doc as Doc<"category_tracks"> & { youtubeId?: string };
      if (rawDoc.youtubeId) {
        const targetTrackId = rawDoc.trackId || rawDoc.youtubeId;
        const cleanDoc = { ...rawDoc };
        delete cleanDoc.youtubeId;

        await ctx.db.replace(doc._id, {
          ...cleanDoc,
          trackId: targetTrackId,
        });
        categoryTracksCount++;
      }
    }

    const tracks = await ctx.db.query("tracks").collect();
    for (const doc of tracks) {
      const rawDoc = doc as Doc<"tracks"> & { youtubeId?: string };
      if (rawDoc.youtubeId) {
        const targetTrackId = rawDoc.trackId || rawDoc.youtubeId;
        const cleanDoc = { ...rawDoc };
        delete cleanDoc.youtubeId;

        await ctx.db.replace(doc._id, {
          ...cleanDoc,
          trackId: targetTrackId,
        });
        tracksCount++;
      }
    }

    return {
      status: "success",
      categoryTracksMigrated: categoryTracksCount,
      tracksMigrated: tracksCount,
    };
  },
});