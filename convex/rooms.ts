import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getRoom = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        const room = await ctx.db.get(args.roomId);
        if (!room) throw new Error("Room not found");

        const track = room.currentTrackId ? await ctx.db.get(room.currentTrackId) : null;

        return { ...room, track };
    },
});

export const createRoom = mutation({
    args: { name: v.string(), isPublic: v.boolean() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) throw new Error("Not logged in");

        const user = await ctx.db
            .query("users")
            .withIndex("workosId", (q) => q.eq("workosId", identity.subject))
            .unique();
        if (!user) throw new Error("User not found");

        const roomId = await ctx.db.insert("rooms", {
            name: args.name,
            hostId: user._id,
            isPlaying: false,
            pausePosition: 0,
            listeners: [user._id], // Host is the first listener
            isPublic: args.isPublic,
        });

        return roomId;
    },
});

export const getPublicRooms = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("rooms")
            .filter((q) => q.eq(q.field("isPublic"), true))
            .collect();
    }
});

export const joinRoom = mutation({
    args: { roomId: v.id("rooms") }, 
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) throw new Error("Not logged in");

        const user = await ctx.db
            .query("users")
            .withIndex("workosId", (q) => q.eq("workosId", identity.subject))
            .unique();
        
        if (!user) return;

        const room = await ctx.db.get(args.roomId);
        if (!room) throw new Error("Room not found");

        if (!room.listeners.includes(user._id)) {
      await ctx.db.patch(args.roomId, {
        listeners: [...room.listeners, user._id],
      });
    }
  },
});

export const syncPlayback = mutation({
  args: { 
    roomId: v.id("rooms"), 
    isPlaying: v.boolean(),
    clientCurrentTime: v.number(), 
    trackId: v.optional(v.id("tracks")) // If they changed the song
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    
    const room = await ctx.db.get(args.roomId);
    if (!room || !user) throw new Error("Not found");

    if (room.hostId !== user._id) {
      throw new Error("Only the host can control playback");
    }

    const updateData: any = {
      isPlaying: args.isPlaying,
    };

    if (args.trackId) {
      updateData.currentTrackId = args.trackId;
    }

    if (args.isPlaying) {
      // PLAYING: We record the exact Convex server millisecond
      // We subtract the clientCurrentTime so if they hit play at 01:00, 
      // the server knows the "0:00" start mark was actually 60 seconds ago.
      const serverTime = Date.now();
      updateData.serverStartTime = serverTime - (args.clientCurrentTime * 1000);
      updateData.pausePosition = 0; // Clear the pause marker
    } else {
      // PAUSED: Save the exact second they stopped at so we can resume later
      updateData.pausePosition = args.clientCurrentTime;
      updateData.serverStartTime = undefined;
    }

    await ctx.db.patch(args.roomId, updateData);
  },
});