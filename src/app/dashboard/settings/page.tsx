"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { User, LogOut, Music, MoreVertical, Pencil } from "lucide-react";

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

  const userData = useQuery(
    api.users.getUserData,
    user?._id ? { userId: user._id } : "skip"

  );


  const hatedTrackIds = useQuery(
    api.neverShowAgain.getUserHatedTracks,
    user?._id ? { userId: user._id } : "skip"
  );
  const toggleHated = useMutation(api.neverShowAgain.togglehated);

  const handleUnhideTrack = async (trackId: string) => {
    if (!user?._id) return;
    try {
      await toggleHated({ userId: user._id, trackId });
    } catch (error) {
      console.error("Failed to unhide track", error);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen px-10 bg-background w-full pb-32">
      <main className="flex-1 w-full min-w-0 relative">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">

            <div className="space-y-2">
              <div className="relative">
                <span className="font-normal">
                  <h3 className="text-4xl text-balance text-foreground">
                    {userData?.name || "displayname"}
                  </h3>
                </span>

                <div className=" flex items-center gap-4 mt-2">

                  <a
                    href="/api/auth/logout"
                    title="Log out"
                    className="flex items-center justify-center p-2 text-primary/70 hover:text-primary rounded-full transition-all duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-5xl pt-10 space-y-5">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">Favorite Genres</h3>
            </div>
            {userData === undefined ? (
              <div className="text-sm text-foreground/50 animate-pulse">Loading genres...</div>
            ) : userData?.favoriteGenres && userData.favoriteGenres.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {userData.favoriteGenres.map((genre: string, idx: number) => (
                  <div
                    key={idx}
                    className="px-5 py-2.5 text-sm font-semibold rounded-full bg-foreground/[0.03] border border-foreground/10 text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors capitalize cursor-default"
                  >
                    {genre}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/50">Not genres selected</p>
            )}
          </div>
          <div className="w-full max-w-5xl mt-16 space-y-6">
            <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pt-12 ">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Never Show Again
              </h2>
            </div>

            <div className="flex flex-col w-full pb-10">
              {hatedTrackIds === undefined ? (
                <div className="text-sm text-foreground/50 animate-pulse px-4 py-8">Loading hidden tracks...</div>
              ) : hatedTrackIds.length === 0 ? (
                <div className="text-sm text-foreground/50">No hated tracks yet.</div>
              ) : (
                hatedTrackIds.map((track: HatedTrack) => {
                  const isString = typeof track === "string";
                  const trackId = isString ? track : (track.trackId || track._id || "");
                  const songName = isString ? "Unknown Song" : (track.name || track.title || "Unknown Song");
                  const artistName = isString ? "Hidden Artist" : (track.artist || "Hidden Artist");
                  const coverUrl = isString ? null : track.coverUrl;

                  return (
                    <div key={trackId} className="group flex items-center justify-between py-2.5 px-4 rounded-md hover:bg-foreground/10 transition-colors cursor-default">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 shrink-0 bg-foreground/10 rounded overflow-hidden shadow-sm">
                          {coverUrl ? (
                            <Image width={500} height={500} unoptimized src={coverUrl} alt={songName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[15px] font-bold text-foreground truncate">{songName}</span>
                          <span className="text-[13px] text-foreground/60 truncate mt-0.5">{artistName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0 pl-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            handleUnhideTrack(trackId);
                          }}
                          className="text-xs font-semibold h-8 hidden group-hover:flex transition-all bg-background"
                        >
                          Unhide
                        </Button>

                        <MoreVertical size={18} className="text-foreground/40 group-hover:text-foreground/80 hidden sm:block cursor-pointer transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}