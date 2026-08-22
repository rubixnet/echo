"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";

export function useRoomState() {
  const user = useUser();
  const activeRoomId = user?.activeRoomId;

  const room = useQuery(
    api.rooms.getRoom,
    activeRoomId ? { roomId: activeRoomId as any } : "skip",
  );

  const exitRoomMutation = useMutation(api.rooms.leaveRoom as any);

  useEffect(() => {
    if (activeRoomId && room === null && user?._id) {
      console.log("Room was closed by host. Automatically leaving...");
      exitRoomMutation({
        userId: user._id as any,
        roomId: activeRoomId as any,
      }).catch(console.error);
    }
  }, [activeRoomId, room, exitRoomMutation, user?._id]);

  const isInRoom = !!activeRoomId && !!room;
  const isHost = isInRoom && room.hostId === user?._id;
  const isGuest = isInRoom && room.hostId !== user?._id;

  const leaveRoom = async () => {
    if (activeRoomId && user?._id) {
      await exitRoomMutation({
        userId: user._id as any,
        roomId: activeRoomId as any,
      });
    }
  };

  return {
    isInRoom,
    isHost,
    isGuest,
    room,
    roomId: activeRoomId,
    leaveRoom,
  };
}
