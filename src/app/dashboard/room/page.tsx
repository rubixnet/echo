"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";

export default function LiveRoomsPage() {
    const router = useRouter();
    const user = useUser();
    
    const [roomNameInput, setRoomNameInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const liveRooms = useQuery(api.rooms?.getPublicRooms || api.rooms?.getRooms); 
    const createRoom = useMutation(api.rooms?.createRoom as any);
    const deleteRoom = useMutation(api.rooms?.deleteRoom as any);

    const handleCreateRoom = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!roomNameInput.trim() || !user?._id) return;
        setIsCreating(true);
        try {
            const newRoomId = await createRoom({ name: roomNameInput, isPublic: true, userId: user._id });
            setRoomNameInput("");
            router.push(`/dashboard/room/${newRoomId}`);
        } catch (error) {
            setIsCreating(false);
        }
    };

    const handleCloseRoom = async (e: React.MouseEvent, roomId: string) => {
        e.preventDefault();
        if (!user?._id) return;
        try { await deleteRoom({ roomId: roomId as any, userId: user._id }); } catch (err) {}
    };

    if (liveRooms === undefined) {
        return (
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <h1 className="text-xl font-bold text-foreground tracking-tight">Live Rooms</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-foreground/5 animate-pulse rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-foreground/5">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Live Rooms</h1>
                    <p className="text-xs text-foreground/50 mt-1">Tune into active sessions or start your own.</p>
                </div>

                <form onSubmit={handleCreateRoom} className="flex items-center gap-2">
                    <input 
                        type="text" 
                        placeholder="Room Name" 
                        value={roomNameInput}
                        onChange={(e) => setRoomNameInput(e.target.value)}
                        className="h-8 px-3 w-48 bg-foreground/5 border border-foreground/10 rounded-lg text-xs font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                    <LiquidContainer radius="8px">
                        <button 
                            type="submit"
                            disabled={!roomNameInput.trim() || isCreating}
                            className="h-8 px-4 text-primary text-xs font-semibold disabled:opacity-70 active:scale-95 disabled:active:scale-100 transition-transform whitespace-nowrap"
                        >
                            {isCreating ? "Starting..." : "Start Room"}
                        </button>
                    </LiquidContainer>
                </form>
            </header>

            {liveRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-sm font-medium text-foreground/50">No active sessions right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {liveRooms.map((room) => {
                        const isHost = user?._id === room.hostId;

                        return (
                            <Link href={`/dashboard/room/${room._id}`} key={room._id} className="block group">
                                <div className="bg-card border border-foreground/10 hover:border-foreground/20 rounded-xl p-4 flex flex-col justify-between h-36 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-sm font-bold text-foreground truncate">{room.name}</h3>
                                            <p className="text-[10px] text-foreground/50 truncate">Host: {room.hostId.slice(-6)}</p>
                                        </div>
                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", room.isPlaying ? "bg-emerald-500 animate-pulse" : "bg-foreground/20")} />
                                    </div>

                                    <div className="flex items-center justify-between gap-3 mt-auto pt-3 border-t border-foreground/5">
                                        <span className="text-[11px] font-medium text-foreground/50">{room.listeners?.length || 1} listening</span>
                                        <div className="flex items-center gap-2">
                                            {isHost && (
                                                <LiquidContainer radius="6px">
                                                    <button onClick={(e) => handleCloseRoom(e, room._id)} className="h-6 px-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-[10px] font-bold transition-colors">
                                                        Close
                                                    </button>
                                                </LiquidContainer>
                                            )}
                                            <LiquidContainer radius="6px">
                                                <div className="h-6 px-3 bg-foreground/10 group-hover:bg-foreground group-hover:text-background text-foreground text-[10px] font-bold flex items-center justify-center transition-colors">
                                                    Join
                                                </div>
                                            </LiquidContainer>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}