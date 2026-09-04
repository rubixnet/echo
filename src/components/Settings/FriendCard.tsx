import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    ListMusic,
    X,
    Radio,
} from "@/components/icons";
import {
    Disc3,
} from "lucide-react";

type FriendPlaylist = {
    _id: string;
    name: string;
    coverUrl?: string | null;
    isLikedSongs?: boolean;
    trackCount: number;
};

type FriendCardProps = {
    friend: {
        _id: string;
        username: string;
        name?: string;
        isOnline: boolean;
        currentTrack?: { coverUrl: string; title: string; artist: string };
        activeRoomId?: string | null;
        activeRoomName?: string | null;
        playlistCount: number;
        playlists?: FriendPlaylist[];
    };
    onRemoveFriend: () => void;
};

export type FriendCardFriend = FriendCardProps["friend"];

export default function FriendCard({
    friend,
    onRemoveFriend,
}: FriendCardProps) {

    return (
        <Link
            href={`/dashboard/friends/${friend._id}`}
            className={cn(
                "rounded-lg hover:bg-foreground/5 hover:text-primary transition-colors overflow-hidden",
            )}
        >
            <div
                className="flex items-center justify-between p-3 cursor-pointer select-none"
            >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-foreground/10  flex items-center justify-center font-bold text-xs text-foreground/80 uppercase overflow-hidden">
                            {friend.currentTrack?.coverUrl ? (
                                <Image
                                    width={36}
                                    height={36}
                                    unoptimized
                                    src={friend.currentTrack.coverUrl}
                                    className="w-full h-full object-cover"
                                    alt={friend.currentTrack.title}
                                />
                            ) : (
                                friend.username.slice(0, 2)
                            )}
                        </div>
                        {friend.isOnline && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                        )}
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                                {friend.username}
                            </span>
                            {friend.activeRoomId && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary px-1.5 py-0.2 rounded-md bg-primary/10">
                                    <Disc3 size={10} className="animate-spin" />
                                    In Room
                                </span>
                            )}
                        </div>

                        {friend.currentTrack ? (
                            <span className="text-[11px] text-foreground/60 flex items-center gap-1.5 truncate mt-0.5">
                                <Radio size={10} className="text-primary shrink-0 animate-pulse" />
                                <span className="truncate">
                                    {friend.currentTrack.title} &bull; {friend.currentTrack.artist}
                                </span>
                            </span>
                        ) : (
                            <span className="text-[11px] text-foreground/40 mt-0.5">
                                {friend.isOnline ? "Online" : "Offline"}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {friend.activeRoomId && (
                        <Button
                            asChild
                            size="sm"
                            className="h-7 px-2.5 text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg gap-1 shadow-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Link href={`/rooms/${friend.activeRoomId}`}>Join Room</Link>
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[11px] text-foreground/60 rounded-lg gap-1 hover:bg-foreground/10"
                    >
                        <ListMusic size={12} />
                        <span>{friend.playlistCount}</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFriend();
                        }}
                        title="Remove friend"
                        className="h-7 w-7 p-0 text-foreground/30 hover:text-red-500 rounded-lg"
                    >
                        <X size={13} />
                    </Button>
                </div>
            </div>
        </Link>
    );
}