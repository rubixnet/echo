"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ListMusic,
  X,
  Radio,
  Music,
} from "@/components/icons";
import {
  Disc3,
  Heart,
  Share2,
  Check,
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
    isExpanded: boolean;
    onToggleExpand: () => void;
    onRemoveFriend: () => void;
};

export type FriendCardFriend = FriendCardProps["friend"];

export default function FriendCard({
    friend,
    isExpanded,
    onToggleExpand,
    onRemoveFriend,
}: FriendCardProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyPlaylistLink = (playlistId: string) => {
        const url = `${window.location.origin}/dashboard/library/playlist/${playlistId}`;
        navigator.clipboard.writeText(url);
        setCopiedId(playlistId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className={cn(
                "rounded-lg transition-colors overflow-hidden",
                isExpanded
                    ? "shadow-sm"
                    : "bg-transparent hover:bg-foreground/[0.02]"
            )}
        >
            <div
                onClick={onToggleExpand}
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
                        <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown size={12} />
                        </motion.span>
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

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="px-3 pb-3 pt-1 border-t border-foreground/5 space-y-3"
                    >
                        {friend.activeRoomId && (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/[0.06] border border-primary/20">
                                <div className="flex items-center gap-2">
                                    <Disc3 size={15} className="text-primary animate-spin" />
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">
                                            {friend.activeRoomName || "Active Room"}
                                        </p>
                                        <p className="text-[10px] text-foreground/60">
                                            Listening in synchronized room
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    className="h-7 px-3 text-xs rounded-lg bg-primary text-primary-foreground"
                                >
                                    <Link href={`/rooms/${friend.activeRoomId}`}>Join Now</Link>
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                                Playlists ({friend.playlists?.length || 0})
                            </span>
                        </div>

                        {!friend.playlists || friend.playlists.length === 0 ? (
                            <p className="text-xs text-foreground/40 italic py-2">
                                No public playlists shared.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {friend.playlists.map((playlist) => (
                                    <div
                                        key={playlist._id}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded-xl border transition-colors",
                                            playlist.isLikedSongs
                                                ? "bg-pink-500/[0.04] border-pink-500/20"
                                                : "bg-foreground/[0.03] border-foreground/5 hover:border-foreground/10"
                                        )}
                                    >
                                        <Link
                                            href={`/dashboard/library/playlist/${playlist._id}`}
                                            className="flex items-center gap-2.5 min-w-0 flex-1"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-foreground/10 overflow-hidden flex items-center justify-center shrink-0">
                                                {playlist.isLikedSongs ? (
                                                    <Heart size={14} className="text-pink-500 fill-pink-500" />
                                                ) : playlist.coverUrl ? (
                                                    <Image
                                                        src={playlist.coverUrl}
                                                        width={32}
                                                        height={32}
                                                        unoptimized
                                                        alt={playlist.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Music size={13} className="text-foreground/40" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-medium text-foreground truncate flex items-center gap-1.5">
                                                    {playlist.name}
                                                    {playlist.isLikedSongs && (
                                                        <span className="text-[9px] px-1 py-0.2 rounded bg-pink-500/10 text-pink-500 font-semibold">
                                                            Liked
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-foreground/40">
                                                    {playlist.trackCount} tracks
                                                </span>
                                            </div>
                                        </Link>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCopyPlaylistLink(playlist._id)}
                                            className="h-7 w-7 p-0 text-foreground/40 hover:text-foreground rounded-lg shrink-0"
                                            title="Share / Copy Link"
                                        >
                                            {copiedId === playlist._id ? (
                                                <Check size={12} className="text-emerald-500" />
                                            ) : (
                                                <Share2 size={12} />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}