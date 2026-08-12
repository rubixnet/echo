"use client";

import React from "react";
import { Star, ListMusic, History, Pin } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { useLibraryData } from "@/hooks/useLibraryData";
import { cn } from "@/lib/utils";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const pathname = usePathname();

  const { playlists, likedSongs, historySongs, isLoading } = useLibraryData(user?._id);

  const sortedPlaylists = [...playlists].sort((a, b) => {
    const aPinned = a.isPinned ?? false;
    const bPinned = b.isPinned ?? false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="flex bg-background text-foreground">
      <aside className="hidden lg:block w-72 md:w-80 shrink-0 relative z-20">
        <div className="absolute right-0 top-0 bottom-0 w-px bg-foreground/10 pointer-events-none" />
        <div className="sticky top-[40px] h-[calc(100vh-40px)] overflow-y-auto liquid-scroll">
          {isLoading ? (
            <SidebarLayoutSkeleton />
          ) : (
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
                    <div className="w-12 h-12 shrink-0 rounded-md bg-radial-[at_top_left] from-cyan-400 via-teal-700 to-slate-950 flex items-center justify-center shadow-sm">
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

                  {(likedSongs.length > 0 || sortedPlaylists.length > 0) && (
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
                    <div className="w-12 h-12 shrink-0 rounded-md bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-sm">
                      <Star size={20} className="fill-white text-white" />
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
                        Favorite Songs
                      </span>
                      <span className="text-xs font-medium text-foreground/50 truncate">
                        {likedSongs.length === 1
                          ? "1 song"
                          : `${likedSongs.length} songs`}
                      </span>
                    </div>
                  </Link>

                  {sortedPlaylists.length > 0 && (
                    <div className="h-px bg-foreground/5 ml-[68px] my-1" />
                  )}
                </>
              )}

              {sortedPlaylists.map((p, index) => (
                <SidebarPlaylistItem
                  key={p._id}
                  playlist={p}
                  isActive={pathname === `/dashboard/library/playlist/${p._id}`}
                  isLast={index === sortedPlaylists.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 pt-0 relative z-10">
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
  const trackCount = playlist.trackCount || 0;
  const coverUrl = playlist.coverUrl;

  return (
    <React.Fragment>
      <div
        className={cn(
          "relative flex items-center p-2 rounded-lg transition-colors group",
          isActive
            ? "bg-foreground/[0.08]"
            : "hover:bg-foreground/[0.04]"
        )}
      >
        <Link
          href={`/dashboard/library/playlist/${playlist._id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-12 h-12 shrink-0 rounded-md bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden shadow-sm relative">
            {coverUrl ? (
              <img
                src={coverUrl}
                className="w-full h-full object-cover"
                alt={playlist.name}
              />
            ) : (
              <ListMusic size={20} className="text-foreground/30" />
            )}

            {playlist.isPinned && (
              <div className="absolute top-1 left-1 bg-background/80 backdrop-blur-md p-1 rounded-full shadow-md text-foreground">
                <Pin size={8} className="fill-current" />
              </div>
            )}
          </div>

          <div className="flex flex-col min-w-0 pr-6">
            <span
              className={cn(
                "text-sm font-bold truncate capitalize transition-colors",
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
      </div>

      {!isLast && <div className="h-px bg-foreground/5 ml-[68px] my-1" />}
    </React.Fragment>
  );
}

export function SidebarLayoutSkeleton() {
  return (
    <div className="flex flex-col w-full px-3 pb-52 pt-0 space-y-1">
      {Array.from({ length: 6 }).map((_, index) => (
        <React.Fragment key={index}>
          <SidebarItemSkeleton />
          {index < 5 && <div className="h-px bg-foreground/5 ml-[68px] my-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function SidebarItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg">
      <div className="w-12 h-12 shrink-0 rounded-md bg-foreground/10 animate-pulse" />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="h-4 w-3/4 bg-foreground/10 rounded-sm animate-pulse" />
        <div className="h-3 w-1/2 bg-foreground/10 rounded-sm animate-pulse" />
      </div>
    </div>
  );
}