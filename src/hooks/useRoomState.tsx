"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";

export function useRoomState() {
    const pathname = usePathname();
    const user = useUser();
    
    const roomMatch = pathname?.match(/\/dashboard\/room\/([^/]+)/);
    const roomId = roomMatch ? roomMatch[1] : null;
    
    const room = useQuery(api.rooms.getRoom, roomId ? { roomId: roomId as any } : "skip");
    
    const isInRoom = !!roomId;
    
    const isHost = isInRoom && room !== undefined && room?.hostId === user?._id;
    const isGuest = isInRoom && room !== undefined && room?.hostId !== user?._id;

    return { isInRoom, isHost, isGuest, room, roomId };
}