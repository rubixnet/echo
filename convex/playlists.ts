import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPlaylist = mutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("playlists", {
      name: args.name,
      userId: args.userId,
      createdAt: Date.now(),
      isPinned: false,
      isPublic: args.isPublic ?? true,
    });
  },
});

export const togglePlaylistPrivacy = mutation({
  args: {
    playlistId: v.id("playlists"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist || playlist.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.playlistId, {
      isPublic: !playlist.isPublic,
    });
  },
});

export const getUserPlaylists = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const isOwner = !args.viewerId || args.viewerId === args.userId;
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) return [];
    if (!isOwner && targetUser.showPlaylists === false) {
      return [];
    }

    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const filtered  = isOwner ? playlists
      : playlists.filter((p) => p.isPublic !== false);

    return await Promise.all(
      filtered.map(async (playlist) => {
        const tracks = await ctx.db
          .query("playlistTracks")
          .withIndex("by_playlist", (q) => q.eq("playlistId", playlist._id))
          .collect();

        return {
          ...playlist,
          trackCount: tracks.length,
          coverUrl: tracks[0]?.coverUrl || null,
        };
      })
    );
  },
});

export const getPlaylistTracks = query({
  args: {
    playlistId: v.id("playlists"),
    viewerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) return null;

    const isOwner = !args.viewerId || args.viewerId === playlist.userId;
    if (!isOwner && playlist.isPublic === false) {
      return null;
    }

    const relations = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .order("desc")
      .collect();

    return relations.map((rel) => {
      const ytId = rel.trackId;
      const fallbackCover =
        ytId && ytId.length === 11
          ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
          : "";

      return {
        _id: rel._id,
        trackId: rel.trackId,
        title: rel.title || "Untitled Track",
        artist: rel.artist || "Unknown Artist",
        coverUrl: rel.coverUrl || fallbackCover || "",
        duration: rel.duration || "0:00",
        audioUrl: rel.audioUrl || `/api/youtube/stream?id=${rel.trackId}`,
        addedAt: rel.addedAt,
      };
    });
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
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("playlistTracks")
      .withIndex("by_playlist_and_track", (q) =>
        q.eq("playlistId", args.playlistId).eq("trackId", args.trackId)
      )
      .first();

    if (existing) {
      return { success: false, message: "Track already exists in playlist" };
    }

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
        q.eq("playlistId", args.playlistId).eq("trackId", args.trackId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, message: "Removed from playlist" };
    }
    return { success: false, message: "Track not found in playlist" };
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