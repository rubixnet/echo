import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPlaylist = mutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("playlists", {
      name: args.name,
      userId: args.userId,
      createdAt: Date.now(),
      isPinned: false,
    });
  },
});

export const getUserPlaylists = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const playlists = await ctx.db
      .query("playlists")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const playlistsWithMeta = await Promise.all(
      playlists.map(async (playlist) => {
        const tracks = await ctx.db
          .query("playlistTracks")
          .withIndex("by_playlist", (q) => q.eq("playlistId", playlist._id))
          .collect();

        return {
          ...playlist,
          trackCount: tracks.length,
          coverUrl: tracks[0]?.coverUrl || null,
        };
      }),
    );

    return playlistsWithMeta;
  },
});

export const addTrack = mutation({
  args: {
    playlistId: v.id("playlists"),
    trackId: v.string(),
    title: v.optional(v.string()),
    artist: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
    duration: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    source: v.optional(
      v.object({
        type: v.string(),
        name: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist_and_track", (q) =>
        q.eq("playlistId", args.playlistId).eq("trackId", args.trackId),
      )
      .first();

    if (existing)
      return { success: false, message: "Track already exists in playlist" };

    await ctx.db.insert("playlistTracks", {
      playlistId: args.playlistId,
      trackId: args.trackId,
      title: args.title || "Unknown Track",
      artist: args.artist || "Unknown Artist",
      coverUrl: args.coverUrl || "",
      duration: args.duration || "0:00",
      audioUrl: args.audioUrl || `/api/youtube/stream?id=${args.trackId}`,
      source: args.source || { type: "playlist" },
      addedAt: Date.now(),
    });
    return { success: true, message: "Added to playlist" };
  },
});

export const removeFromPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    trackId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist_and_track", (q) =>
        q.eq("playlistId", args.playlistId).eq("trackId", args.trackId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, message: "Removed from playlist" };
    } else {
      return { success: false, message: "Track not found in playlist" };
    }
  },
});

export const getPlaylistTracks = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const relations = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .order("desc")
      .collect();
    return relations.map((rel: any) => {
      const ytId = rel.trackId;
      const fallbackCover =
        ytId && ytId.length === 11
          ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
          : null;

      return {
        _id: rel._id,
        trackId: rel.trackId,
        youtubeId: rel.trackId,
        title: rel.title || "Untitled Track",
        artist: rel.artist || "Unknown Artist",
        coverUrl: rel.coverUrl || fallbackCover,
        duration: rel.duration || "0:00",
        audioUrl: rel.audioUrl || `/api/youtube/stream?id=${rel.trackId}`,
        addedAt: rel.addedAt,
      };
    });
  },
});

export const deletePlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);

    if (!playlist || playlist.userId !== args.userId) {
      throw new Error("unauthorized");
    }
    const tracks = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    for (const track of tracks) {
      await ctx.db.delete(track._id);
    }
    await ctx.db.delete(args.playlistId);
  },
});

export const updatePlaylistInfo = mutation({
  args: {
    playlistId: v.id("playlists"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);

    if (!playlist) throw new Error("Playlist not found");

    await ctx.db.patch(args.playlistId, {
      name: args.name,
    });
  },
});

export const togglePinned = mutation({
  args: {
    playlistId: v.id("playlists"),
  },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);

    if (!playlist) throw new Error("Playlist not found");

    await ctx.db.patch(args.playlistId, {
      isPinned: !playlist.isPinned,
    });
  },
});
