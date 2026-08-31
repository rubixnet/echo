"use client";

import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { cn } from "@/lib/utils";
import {
  User,
} from "@/components/icons";
import FriendCard from "./FriendCard";
import { Id } from "../../../convex/_generated/dataModel";

export default function FriendsSection() {
    const user = useUser();
    const convex = useConvex();

    const [friendTagInput, setFriendTagInput] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showUsersPopover, setShowUsersPopover] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [expandedFriendId, setExpandedFriendId] = useState<Id<"users"> | null>(
        null
    );

    const userData = useQuery(
        api.users.getUserData,
        user?._id ? { userId: user._id } : "skip"
    );

    const friends = useQuery(
        api.friends.getFriendsData,
        user?._id ? { userId: user._id } : "skip"
    );

    const toggleFriend = useMutation(api.friends.toggleFriend);

    const usersList = useQuery(
        api.users.searchUsers,
        { query: friendTagInput }
    );

    const handleAddFriend = async (nameToAdd?: string) => {
        const queryTerm = (nameToAdd || friendTagInput).trim();
        if (!user?._id || !queryTerm) return;

        try {
            setLoading(true);
            setErrorMsg(null);

            const matches = await convex.query(api.users.searchUsers, {
                query: queryTerm,
            });

            const targetUser = matches?.[0];
            if (!targetUser) {
                setErrorMsg("User not found with that username.");
                return;
            }

            if (targetUser._id === user._id) {
                setErrorMsg("You cannot add yourself.");
                return;
            }

            const isAlreadyFriend = friends?.some((f: any) => f._id === targetUser._id);
            if (isAlreadyFriend) {
                setErrorMsg("Already in your friends list.");
                return;
            }

            await toggleFriend({
                userId: user._id,
                friendId: targetUser._id,
            });

            setFriendTagInput("");
            setShowUsersPopover(false);
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to add friend");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">Friends</h2>
                    <span className="text-xs text-foreground/40 font-mono">
                        {" "}
                        ({friends?.length ?? 0})
                    </span>
                </div>

                <div className="relative">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAddFriend();
                        }}
                        className="flex items-center gap-2"
                    >
                        <div className="flex-1 min-w-0">
                            <LiquidContainer radius="14px" className="w-full h-9 shadow-none">
                                <input
                                    type="text"
                                    placeholder="Add by username..."
                                    value={friendTagInput}
                                    onChange={(e) => {
                                        setFriendTagInput(e.target.value);
                                        setShowUsersPopover(true);
                                        setSelectedIndex(-1);
                                        if (errorMsg) setErrorMsg(null);
                                    }}
                                    onFocus={() => setShowUsersPopover(true)}
                                    className="w-full h-full bg-transparent px-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none"
                                />
                            </LiquidContainer>
                        </div>
                        <LiquidContainer radius="14px" className="h-9 shrink-0 shadow-none">
                            <button
                                type="submit"
                                disabled={!friendTagInput.trim() || loading}
                                className="h-full select-none px-3 text-primary text-xs font-semibold disabled:opacity-40 active:scale-98 transition-transform whitespace-nowrap cursor-pointer"
                            >
                                {loading ? "Adding..." : "Add Friend"}
                            </button>
                        </LiquidContainer>
                    </form>

                    {showUsersPopover && usersList && usersList.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 slide-in-from-top-2 duration-200 z-50">
                            <LiquidPanel radius="12px" className="w-[200px] sm:w-[224px]">
                                <div className="space-y-0.5 max-h-48 overflow-y-auto liquid-scroll mr-1">
                                    {usersList.map((item, index) => (
                                        <button
                                            key={item._id}
                                            type="button"
                                            onClick={() => handleAddFriend(item.username)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-[14px] transition-colors text-left group",
                                                index === selectedIndex
                                                    ? "bg-foreground/10"
                                                    : "hover:bg-foreground/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2.5 text-foreground/50 group-hover:text-foreground">
                                                <User size={14} className="text-primary" />
                                                <span className="text-xs font-medium text-foreground">
                                                    {item.username}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </LiquidPanel>
                        </div>
                    )}
                </div>
            </div>

            {errorMsg && (
                <p className="text-[11px] text-red-500 font-medium px-1">{errorMsg}</p>
            )}

            <div className="flex flex-col gap-2 pt-1">
                {friends === undefined ? (
                    <div className="py-4 text-xs text-foreground/40 animate-pulse">
                        Loading friends...
                    </div>
                ) : friends.length === 0 ? (
                    <div className="py-6 text-center border-t border-foreground/10">
                        <p className="text-xs font-medium text-foreground/40">
                            No friends added yet.
                        </p>
                    </div>
                ) : (
                    friends.map((friend: any) => (
                        <FriendCard
                            key={friend._id}
                            friend={friend}
                            user={user}
                            isExpanded={expandedFriendId === friend._id}
                            onToggleExpand={() =>
                                setExpandedFriendId(
                                    expandedFriendId === friend._id ? null : friend._id
                                )
                            }
                            onRemoveFriend={() =>
                                toggleFriend({
                                    userId: user._id,
                                    friendId: friend._id,
                                })
                            }
                        />
                    ))
                )}
            </div>
        </div>
    );
}