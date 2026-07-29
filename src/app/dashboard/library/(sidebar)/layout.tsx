"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Heart, ListMusic, Loader2, History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const pathname = usePathname();

  const playlists = useQuery(
    api.playlists.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip"
  );
  const likedSongs = useQuery(
    api.likes.getMyLikes,
    user?._id ? { userId: user._id } : "skip"
  );
  const historySongs = useQuery(
    api.history.getUserHistory,
    user?._id ? { userId: user._id } : "skip"
  );

  if (
    playlists === undefined ||
    likedSongs === undefined ||
    historySongs === undefined
  ) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-start justify-center pt-10 bg-background">
        <Loader2 className="animate-spin text-highlight" size={32} />
      </div>
    );
  }

  return (
    <div className="flex bg-background text-foreground">
      <aside className="hidden lg:block w-72 md:w-80 shrink-0 relative">
        <div className="absolute right-0 top-0 bottom-0 w-px bg-foreground/10 pointer-events-none" />

        {/* 
          1. h-[calc(100vh-40px)] explicitly locks the height to the viewport so it doesn't stretch down.
          2. overflow-y-auto turns it into its own independent scrollable container.
          3. liquid-scroll is added so it maps to any specific CSS class rules you create.
        */}
        <div className="sticky top-[40px] h-[calc(100vh-40px)] overflow-y-auto liquid-scroll">
          
          <div className="flex flex-col w-full px-3 pb-52 pt-0">
            
            {historySongs.length > 0 && (
              <>
                <Link
                  href="/dashboard/library/history"
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                    pathname === "/dashboard/library/history"
                      ? "bg-foreground/[0.08]"
                      : "hover:bg-foreground/[0.04]"
                  )}
                >
                  <div className="w-12 h-12 shrink-0 rounded-md bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-sm">
                    <History size={20} className="fill-transparent text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "text-sm font-bold truncate transition-colors",
                        pathname === "/dashboard/library/history"
                          ? "text-foreground"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                    >
                      Recently Played
                    </span>
                    <span className="text-xs font-medium text-foreground/50 truncate">
                      {historySongs.length === 1
                        ? "1 song"
                        : `${historySongs.length} songs`}
                    </span>
                  </div>
                </Link>

                {(likedSongs.length > 0 || playlists.length > 0) && (
                  <div className="h-px bg-foreground/5 ml-[68px] my-1" />
                )}
              </>
            )}

            {likedSongs.length > 0 && (
              <>
                <Link
                  href="/dashboard/library/liked"
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                    pathname === "/dashboard/library/liked"
                      ? "bg-foreground/[0.08]"
                      : "hover:bg-foreground/[0.04]"
                  )}
                >
                  <div className="w-12 h-12 shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <Heart size={20} className="fill-white text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span
                      className={cn(
                        "text-sm font-bold truncate transition-colors",
                        pathname === "/dashboard/library/liked"
                          ? "text-foreground"
                          : "text-foreground/80 group-hover:text-foreground"
                      )}
                    >
                      Liked Songs
                    </span>
                    <span className="text-xs font-medium text-foreground/50 truncate">
                      {likedSongs.length === 1
                        ? "1 song"
                        : `${likedSongs.length} songs`}
                    </span>
                  </div>
                </Link>

                {playlists.length > 0 && (
                  <div className="h-px bg-foreground/5 ml-[68px] my-1" />
                )}
              </>
            )}

            {playlists.map((p, index) => (
              <SidebarPlaylistItem
                key={p._id}
                playlist={p}
                isActive={pathname === `/dashboard/library/playlist/${p._id}`}
                isLast={index === playlists.length - 1}
              />
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pt-0">
        {children}
      </main>
    </div>
  );
}

function SidebarPlaylistItem({
  playlist,
  isActive,
  isLast,
}: {
  playlist: any;
  isActive: boolean;
  isLast: boolean;
}) {
  const tracks = useQuery(api.playlists.getPlaylistTracks, {
    playlistId: playlist._id,
  });
  const trackCount = tracks?.length || 0;
  const coverUrl =
    playlist.coverUrl ||
    (tracks && tracks.length > 0 ? tracks[0]?.coverUrl : null);

  return (
    <React.Fragment>
      <Link
        href={`/dashboard/library/playlist/${playlist._id}`}
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-colors group",
          isActive
            ? "bg-foreground/[0.08]"
            : "hover:bg-foreground/[0.04]"
        )}
      >
        <div className="w-12 h-12 shrink-0 rounded-md bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden shadow-sm">
          {coverUrl ? (
            <img
              src={coverUrl}
              className="w-full h-full object-cover"
              alt={playlist.name}
            />
          ) : (
            <ListMusic size={20} className="text-foreground/30" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className={cn(
              "text-sm font-bold truncate transition-colors",
              isActive
                ? "text-foreground"
                : "text-foreground/80 group-hover:text-foreground"
            )}
          >
            {playlist.name}
          </span>
          <span className="text-xs font-medium text-foreground/50 truncate">
            {trackCount === 1 ? "1 song" : `${trackCount} songs`}
          </span>
        </div>
      </Link>

      {!isLast && <div className="h-px bg-foreground/5 ml-[68px] my-1" />}
    </React.Fragment>
  );
}