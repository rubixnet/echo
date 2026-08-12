"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { Users } from "lucide-react";

export default function LiveRoomsPage() {
    const router = useRouter();
    const user = useUser();
    
    const [roomNameInput, setRoomNameInput] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    const liveRooms = useQuery(api.rooms?.getPublicRooms || api.rooms?.getRooms); 
    const createRoom = useMutation(api.rooms?.createRoom as any);
    const deleteRoom = useMutation(api.rooms?.deleteRoom as any);
    const joinRoom = useMutation(api.rooms?.joinRoom as any);

    const handleCreateRoom = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!roomNameInput.trim() || !user?._id) return;
        setIsCreating(true);
        try {
            const newRoomId = await createRoom({ 
                name: roomNameInput, 
                isPublic: true, 
                userId: user._id as Id<"users"> 
            });
            setRoomNameInput("");
            router.push(`/dashboard/rooms/${newRoomId}`);
        } catch (error) {
            setIsCreating(false);
        }
    }; 

    const handleJoinRoom = async (e: React.MouseEvent, roomId: string) => {
        e.preventDefault();
        if (!user?._id) return;
        
        setJoiningId(roomId);
        try {
            await joinRoom({ 
                roomId: roomId as Id<"rooms">, 
                userId: user._id as Id<"users"> 
            });
            router.push(`/dashboard/rooms/${roomId}`);
        } catch (error) {
            console.error("Failed to join room:", error);
        } finally {
            setJoiningId(null);
        }
    };

    const handleCloseRoom = async (e: React.MouseEvent, roomId: string) => {
        e.preventDefault(); 
        e.stopPropagation();
        if (!user?._id) return;
        try { 
            await deleteRoom({ 
                roomId: roomId as Id<"rooms">, 
                userId: user._id as Id<"users"> 
            }); 
        } catch (err) {
            console.error(err);
        }
    };

    if (liveRooms === undefined) {
        return (
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                <h1 className="text-xl font-bold text-foreground tracking-tight">Live Rooms</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-foreground/5 animate-pulse rounded-2xl" />)}
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
                        className="h-9 px-3 w-48 bg-foreground/5 border border-foreground/10 rounded-lg text-xs font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                    <LiquidContainer radius="12px">
                        <button 
                            type="submit"
                            disabled={!roomNameInput.trim() || isCreating}
                            className="h-9 px-4 text-primary text-xs font-semibold disabled:opacity-70 active:scale-98 disabled:scale-100 transition-transform whitespace-nowrap"
                        >
                            {isCreating ? "Starting..." : "Start Room"}
                        </button>
                    </LiquidContainer>
                </form>
            </header>

            {liveRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-foreground/10 rounded-2xl bg-foreground/[0.02]">
                    <p className="text-sm font-medium text-foreground/50">No active sessions right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {liveRooms.map((room) => {
                        const isHost = user?._id === room.hostId;
                        const isUserInThisRoom = user?.activeRoomId === room._id;

                        return (
                            <div 
                                key={room._id} 
                                onClick={(e) => handleJoinRoom(e, room._id)}
                                className="bg-foreground/[0.02] border border-foreground/10 hover:border-foreground/20 hover:bg-foreground/[0.04] rounded-2xl p-5 flex flex-col justify-between h-40 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col min-w-0">
                                        <h3 className="text-sm font-bold text-foreground truncate">{room.name}</h3>
                                        <p className="text-[10px] text-foreground/50 truncate mt-0.5 font-medium uppercase tracking-wider">Host: {room.hostId.slice(-6)}</p>
                                    </div>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full shrink-0 mt-1.5 transition-colors duration-500", 
                                        room.isPlaying ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-foreground/20"
                                    )} />
                                </div>

                                <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-foreground/5">
                                    <span className="text-[11px] font-medium text-foreground/50 flex items-center gap-1.5">
                                        <Users size={12} /> {room.listeners?.length || 1}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {isHost && (
                                            <button 
                                                onClick={(e) => handleCloseRoom(e, room._id)} 
                                                className="h-7 px-3 bg-destructive/5 cursor-pointer text-primary/80 border-destructive/80 border hover:text-primary hover:bg-destructive rounded-lg text-[10px] font-bold transition-colors z-10"
                                            >
                                                Close
                                            </button>
                                        )}
                                        <LiquidContainer radius="8px">
                                            <button 
                                                onClick={(e) => handleJoinRoom(e, room._id)}
                                                disabled={joiningId === room._id}
                                                className="h-7 px-4 bg-foreground/5 rounded-[8px] text-foreground text-[11px] font-bold flex items-center justify-center transition-colors"
                                            >
                                                {joiningId === room._id ? "Joining..." : isUserInThisRoom ? "Listening" : "Join"}
                                            </button>
                                        </LiquidContainer>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}