import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRoom = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        const room = await ctx.db.get(args.roomId);
        if (!room) throw new Error("Room not found");

        const track = room.currentTrackId ? await ctx.db.get(room.currentTrackId) : null;

        return { ...room, track };
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

export const createRoom = mutation({
    args: {
        name: v.string(),
        isPublic: v.boolean(),
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const roomId = await ctx.db.insert("rooms", {
            name: args.name,
            hostId: user._id,
            isPlaying: false,
            pausePosition: 0,
            listeners: [user._id],
            isPublic: args.isPublic,
        });

        return roomId;
    },
});

export const joinRoom = mutation({
    args: {
        roomId: v.id("rooms"),
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
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
        trackId: v.optional(v.id("tracks")),
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
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
            const serverTime = Date.now();
            updateData.serverStartTime = serverTime - (args.clientCurrentTime * 1000);
            updateData.pausePosition = 0;
        } else {
            updateData.pausePosition = args.clientCurrentTime;
            updateData.serverStartTime = undefined;
        }

        await ctx.db.patch(args.roomId, updateData);
    },
});

export const deleteRoom = mutation({
    args: {
        roomId: v.id("rooms"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const room = await ctx.db.get(args.roomId)
        if (!room) return;
        if (room.hostId === args.userId) {
            await ctx.db.delete(args.roomId);
        }
    }
})
