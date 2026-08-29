"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQuery, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropodown-menu";
import { useTheme } from "next-themes";
import {
  LogOut,
  User,
  Music,
  Sun,
  Moon,
  Laptop,
  Trash,
  ChevronDown,
  Radio,
  ListMusic,
  Sparkles,
  X,
} from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

type HatedTrack =
  | string
  | {
    trackId?: string;
    _id?: string;
    name?: string;
    title?: string;
    artist?: string;
    coverUrl?: string;
  };

export default function SettingsPage() {
  const user = useUser();
  const convex = useConvex();
  const [mounted, setMounted] = useState(false);
  const [friendTagInput, setFriendTagInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [showUsersPopover, setShowUsersPopover] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userData = useQuery(
    api.users.getUserData,
    user?._id ? { userId: user._id } : "skip"
  );

  const friends = useQuery(
    api.friends.getFriendsData,
    user?._id ? { userId: user._id } : "skip"
  );

  const hatedTrackIds = useQuery(
    api.neverShowAgain.getUserHatedTracks,
    user?._id ? { userId: user._id } : "skip"
  );

  const toggleFriend = useMutation(api.friends.toggleFriend);
  const removeFromNeverShowAgainTracks = useMutation(
    api.neverShowAgain.removeFromNeverShowAgainTracks
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

      const isAlreadyFriend = friends?.some((f) => f._id === targetUser._id);
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

  const handleRemoveFriend = async (friendId: Id<"users">) => {
    if (!user?._id) return;
    try {
      await toggleFriend({
        userId: user._id,
        friendId,
      });
    } catch (error) {
      console.error("Failed to remove friend", error);
    }
  };

  const usersList = useQuery(api.users.searchUsers, { query: friendTagInput });

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const listLength = usersList?.length || 0;
    if (!showUsersPopover || listLength === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < listLength - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const selectedUser = usersList?.[selectedIndex];
      if (selectedUser?.username) {
        handleAddFriend(selectedUser.username);
      }
    } else if (e.key === "Escape") {
      setShowUsersPopover(false);
    }
  };

  const handleRemoveHatedTrack = async (trackId: string) => {
    if (!user?._id) return;
    try {
      await removeFromNeverShowAgainTracks({ userId: user._id, trackId });
    } catch (error) {
      console.error("Failed to remove track", error);
    }
  };

  const username = userData?.username || userData?.name || "username";

  if (!user) return null;

  return (
    <div className="w-full min-h-full flex justify-center p-3  md:p-10 pb-32 text-foreground bg-background">
      <main className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between pb-5">
          <h1 className="text-2xl font-bold tracking-tight capitalize text-foreground truncate">
            {username}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 px-3 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/10 border border-foreground/10 rounded-xl gap-2"
                >
                  {!mounted ? (
                    <span className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : theme === "dark" ? (
                    <Moon size={14} className="text-primary" />
                  ) : theme === "light" ? (
                    <Sun size={14} className="text-primary" />
                  ) : (
                    <Laptop size={14} className="text-primary" />
                  )}

                  <span className="capitalize">
                    {mounted ? theme || "system" : "system"}
                  </span>

                  <ChevronDown size={12} className="opacity-50" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-36 rounded-xl shadow-none"
              >
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="cursor-pointer text-xs font-medium rounded-lg"
                >
                  <Sun size={13} className="mr-2 opacity-70" />
                  Light
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="cursor-pointer text-xs font-medium rounded-lg"
                >
                  <Moon size={13} className="mr-2 opacity-70" />
                  Dark
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className="cursor-pointer text-xs font-medium rounded-lg"
                >
                  <Laptop size={13} className="mr-2 opacity-70" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              asChild
              className="h-9 w-9 p-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10 border border-foreground/10 rounded-xl"
              title="Log out"
            >
              <a href="/api/auth/logout">
                <LogOut size={15} />
              </a>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Friends</h2>
              <span className="text-xs text-foreground/40 font-mono">
                ({friends?.length ?? 0})
              </span>
            </div>

            <div className="relative">
              <form onSubmit={(e) => { e.preventDefault(); handleAddFriend(); }} className="flex items-center gap-2">
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
                      onKeyDown={handleInputKeyDown}
                      className="w-full h-full bg-transparent px-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none"
                    />
                  </LiquidContainer>
                </div>

                <LiquidContainer radius="14px" className="h-9 shrink-0 shadow-none">
                  <button
                    type="submit"
                    disabled={!friendTagInput.trim() || loading}
                    className="h-full select-none px-3 text-primary text-xs font-semibold disabled:opacity-40 active:scale-95 transition-transform whitespace-nowrap cursor-pointer"
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
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-[16px] transition-colors text-left group",
                            index === selectedIndex
                              ? "bg-foreground/10"
                              : "hover:bg-foreground/5",
                          )}
                        >
                          <div className="flex items-center gap-3 text-foreground/50 group-hover:text-foreground transition-colors">
                            <User size={16} className="text-primary" />
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

          <div className="flex flex-col gap-0.5 pt-1">
            {friends === undefined ? (
              <div className="py-4 text-xs text-foreground/40 animate-pulse">
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div className="py-6 text-center border-t border-foreground/10">
                <p className="text-xs font-medium text-foreground/40">No friends added yet.</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-foreground/[0.04] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-foreground/10 border border-foreground/5 flex items-center justify-center font-bold text-xs text-foreground/80 uppercase">
                        {friend.currentTrack?.coverUrl ? <Image width={20} height={20} unoptimized
                          src={friend.currentTrack.coverUrl}
                          className="w-full h-full object-cover rounded-lg"
                          alt={friend.currentTrack.title}
                        /> : friend.username.slice(0, 2)}
                      </div>
                      {friend.isOnline && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {friend.username}
                      </span>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-medium text-foreground/60 hover:bg-transparent rounded-xl gap-1.5"
                      onClick={() => console.log("View playlists for:", friend.username)}
                    >
                      <ListMusic size={13} />
                      <span className="hidden sm:inline">Playlists</span>
                      <span className="text-[10px] text-foreground/40 font-mono">
                        ({friend.playlistCount})
                      </span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend._id)}
                      title="Remove friend"
                      className="h-8 w-8 p-0 text-foreground/30 hover:text-red-500 hover:bg-foreground/5 rounded-xl transition-colors"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Your Favorite Genres</h2>
          {userData === undefined ? (
            <div className="flex gap-2">
              <div className="h-7 w-20 bg-foreground/10 rounded-xl animate-pulse" />
              <div className="h-7 w-16 bg-foreground/10 rounded-xl animate-pulse" />
            </div>
          ) : userData?.favoriteGenres && userData.favoriteGenres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {userData.favoriteGenres.map((genre: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border border-foreground/10 bg-foreground/[0.03] text-foreground/80 hover:bg-foreground/10 transition-colors capitalize cursor-default"
                >
                  <Sparkles className="w-3 h-3 mr-1.5 text-foreground/50" />
                  {genre}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-foreground/40">No favorite genres selected.</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Never Show Again</h2>
            {hatedTrackIds && hatedTrackIds.length > 0 && (
              <span className="text-xs text-foreground/40 font-mono">
                {hatedTrackIds.length} hidden
              </span>
            )}
          </div>

          {hatedTrackIds === undefined ? (
            <div className="space-y-1.5">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-9 h-9 bg-foreground/10 rounded-xl animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/3 bg-foreground/10 rounded-lg animate-pulse" />
                    <div className="h-2.5 w-1/5 bg-foreground/10 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

          ) : hatedTrackIds.length === 0 ? (
            <div className="py-8 text-center border-t border-foreground/10">
              <p className="text-xs font-medium text-foreground/60">No hidden tracks</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 border-t border-foreground/10 pt-1">
              {hatedTrackIds.map((track: HatedTrack) => {
                const isString = typeof track === "string";
                const trackId = isString ? track : track.trackId || track._id || "";
                const songName = isString
                  ? "Unknown Song"
                  : track.name || track.title || "Unknown Song";
                const artistName = isString
                  ? "Hidden Artist"
                  : track.artist || "Hidden Artist";
                const coverUrl = isString ? null : track.coverUrl;

                return (
                  <div
                    key={trackId}
                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-foreground/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-card border border-foreground/10 overflow-hidden flex items-center justify-center">
                        {coverUrl ? (
                          <Image
                            width={36}
                            height={36}
                            unoptimized
                            src={coverUrl}
                            alt={songName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-4 h-4 text-foreground/40" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {songName}
                        </span>
                        <span className="text-[11px] text-foreground/60 truncate mt-0.5">
                          {artistName}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveHatedTrack(trackId)}
                      title="Remove from hidden list"
                      className="h-8 w-8 p-0 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-colors shrink-0"
                    >
                      <Trash size={14} />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}