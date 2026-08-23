import { mutation, query, internalMutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

export const ROOM_HEARTBEAT_MS = 15_000;
export const ROOM_EXPIRY_MS = 120_000;

export type RoomResult =
  | { ok: true }
  | { ok: false; reason: "ROOM_NOT_FOUND" | "NOT_HOST" | "USER_NOT_FOUND" };

export const getServerTime = query({
  args: {},
  handler: async () => Date.now(),
});

async function resolveTrack(ctx: QueryCtx, trackId?: string | null) {
  if (!trackId) return null;

  const youtubeTrack = await ctx.db
    .query("tracks")
    .withIndex("by_youtubeId", (q) => q.eq("youtubeId", trackId))
    .first();
  if (youtubeTrack) return youtubeTrack;

  if (trackId.length > 15) {
    try {
      return await ctx.db.get(trackId as Id<"tracks">);
    } catch {
      return null;
    }
  }
  return null;
}

async function destroyRoom(ctx: MutationCtx, room: Doc<"rooms">) {
  const members = await ctx.db
    .query("users")
    .filter((q) => q.eq(q.field("activeRoomId"), room._id))
    .collect();

  for (const member of members) {
    await ctx.db.patch(member._id, { activeRoomId: undefined });
  }

  await ctx.db.delete(room._id);
}

async function removeFromListeners(
  ctx: MutationCtx,
  room: Doc<"rooms">,
  userId: Id<"users">,
) {
  if (!room.listeners.includes(userId)) return;
  await ctx.db.patch(room._id, {
    listeners: room.listeners.filter((id) => id !== userId),
  });
}

async function detachFromCurrentRoom(
  ctx: MutationCtx,
  user: Doc<"users">,
) {
  const prevRoomId = user.activeRoomId as Id<"rooms"> | undefined;
  await ctx.db.patch(user._id, { activeRoomId: undefined });
  if (!prevRoomId) return;

  const prevRoom = await ctx.db.get(prevRoomId);
  if (!prevRoom) return;

  if (prevRoom.hostId === user._id) {
    await destroyRoom(ctx, prevRoom);
  } else {
    await removeFromListeners(ctx, prevRoom, user._id);
  }
}

function recordEvent(
  room: Partial<Doc<"rooms">>,
  type: string,
  byUserId?: Id<"users">,
) {
  room.lastEvent = { type, at: Date.now(), byUserId };
}

const OK: RoomResult = { ok: true };
const ROOM_GONE: RoomResult = { ok: false, reason: "ROOM_NOT_FOUND" };
const NOT_HOST: RoomResult = { ok: false, reason: "NOT_HOST" };

export const getMyActiveRoom = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user?.activeRoomId) return null;

    const room = await ctx.db.get(user.activeRoomId);
    if (!room) return null; // stale pointer; heartbeat/heal will clean it up

    const track = await resolveTrack(ctx, room.currentTrackId);
    return { ...room, track };
  },
});

export const getRoom = query({
  args: { roomId: v.optional(v.id("rooms")) },
  handler: async (ctx, args) => {
    if (!args.roomId) return null;
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const track = await resolveTrack(ctx, room.currentTrackId);
    return { ...room, track };
  },
});

export const getMyHostedRooms = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    return await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("hostId"), args.userId!))
      .first();
  },
});

export const getMyHosterRooms = getMyHostedRooms;

export const getPublicRooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
  },
});


export const createRoom = mutation({
  args: {
    name: v.string(),
    isPublic: v.boolean(),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ ok: boolean; roomId?: string }> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { ok: false };

    await detachFromCurrentRoom(ctx, user);

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      hostId: user._id,
      isPlaying: false,
      pausePosition: 0,
      listeners: [user._id],
      isPublic: args.isPublic,
      lastActiveAt: Date.now(),
    });

    await ctx.db.patch(user._id, { activeRoomId: roomId });
    return { ok: true, roomId };
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<RoomResult> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { ok: false, reason: "USER_NOT_FOUND" };

    const room = await ctx.db.get(args.roomId);
    if (!room) return ROOM_GONE;

    await detachFromCurrentRoom(ctx, user);

    if (!room.listeners.includes(user._id)) {
      const patch: Partial<Doc<"rooms">> = {
        listeners: [...room.listeners, user._id],
      };
      recordEvent(patch, "joined", user._id);
      await ctx.db.patch(room._id, patch);
    }

    await ctx.db.patch(user._id, { activeRoomId: room._id });
    return OK;
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms"), userId: v.id("users") },
  handler: async (ctx, args): Promise<RoomResult> => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      await ctx.db.patch(args.userId, { activeRoomId: undefined });
      return ROOM_GONE;
    }

    if (room.hostId === args.userId) {
      await destroyRoom(ctx, room);
      return OK;
    }

    await removeFromListeners(ctx, room, args.userId);
    const user = await ctx.db.get(args.userId);
    if (user?.activeRoomId === args.roomId) {
      await ctx.db.patch(args.userId, { activeRoomId: undefined });
    }
    return OK;
  },
});

export const closeRoom = mutation({
  args: { roomId: v.id("rooms"), userId: v.id("users") },
  handler: async (ctx, args): Promise<RoomResult> => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return ROOM_GONE;
    if (room.hostId !== args.userId) return NOT_HOST;

    await destroyRoom(ctx, room);
    return OK;
  },
});

export const syncPlayback = mutation({
  args: {
    roomId: v.id("rooms"),
    isPlaying: v.boolean(),
    clientCurrentTime: v.number(),
    trackId: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<RoomResult> => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return ROOM_GONE;
    if (room.hostId !== args.userId) return NOT_HOST;

    const serverNow = Date.now();
    const safeTime = Math.max(0, args.clientCurrentTime);

    const updateData: Partial<Doc<"rooms">> = {
      isPlaying: args.isPlaying,
      lastActiveAt: serverNow,
    };

    if (args.trackId) updateData.currentTrackId = args.trackId;

    if (args.isPlaying) {
      updateData.serverStartTime = serverNow - safeTime * 1000;
      updateData.pausePosition = safeTime;
      recordEvent(updateData, "play", args.userId);
    } else {
      updateData.pausePosition = safeTime;
      updateData.serverStartTime = undefined;
      recordEvent(updateData, "pause", args.userId);
    }

    await ctx.db.patch(args.roomId, updateData);
    return OK;
  },
});

export const updateRoomTrack = mutation({
  args: {
    roomId: v.id("rooms"),
    trackId: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<RoomResult> => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return ROOM_GONE;
    if (args.userId && room.hostId !== args.userId) return NOT_HOST;

    const serverNow = Date.now();
    const updateData: Partial<Doc<"rooms">> = {
      currentTrackId: args.trackId,
      isPlaying: true,
      pausePosition: 0,
      serverStartTime: serverNow,
      lastActiveAt: serverNow,
    };
    recordEvent(updateData, "track_changed", args.userId);

    await ctx.db.patch(args.roomId, updateData);
    return OK;
  },
});

export const keepRoomAlive = mutation({
  args: { roomId: v.id("rooms"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args): Promise<RoomResult> => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return ROOM_GONE;
    if (args.userId && room.hostId !== args.userId) return OK; // guests: no-op

    await ctx.db.patch(args.roomId, { lastActiveAt: Date.now() });
    return OK;
  },
});

export const clearStaleMembership = mutation({
  args: { userId: v.id("users"), roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.activeRoomId !== args.roomId) return;
    const room = await ctx.db.get(args.roomId);
    if (room) return;
    await ctx.db.patch(args.userId, { activeRoomId: undefined });
  },
});

export const closeRoomInternal = internalMutation({
  args: { roomId: v.id("rooms"), hostUserId: v.id("users") },
  handler: async (ctx, args): Promise<boolean> => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return false;
    if (room.hostId !== args.hostUserId) return false;
    await destroyRoom(ctx, room);
    return true;
  },
});

export const clearExpiredRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - ROOM_EXPIRY_MS;

    const zombies = await ctx.db
      .query("rooms")
      .filter((q) => q.lt(q.field("lastActiveAt"), cutoff))
      .collect();

    for (const room of zombies) {
      await destroyRoom(ctx, room);
    }

    return zombies.length;
  },
});
