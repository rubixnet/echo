"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { ListMusic, Music } from "@/components/icons";

export default function FriendsPlaylistsPage() {
  const user = useUser();
  const groups = useQuery(
    api.playlists.getFriendsPlaylists,
    user?._id ? { userId: user._id } : "skip",
  );

  const isLoading = groups === undefined;

  return (
    <div className="px-6 lg:px-12 py-8 pb-32 space-y-12 bg-background text-foreground max-w-7xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Friends&apos; Playlists</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 animate-pulse">
              <div className="aspect-square rounded-md bg-foreground/5" />
              <div className="h-4 w-3/4 rounded bg-foreground/5" />
              <div className="h-3 w-1/2 rounded bg-foreground/5" />
            </div>
          ))}
        </div>
      ) : !groups || groups.length === 0 ? (
        <div className="py-24 text-center">
          <Music size={40} className="mx-auto mb-4 text-foreground/20" />
          <p className="text-base font-semibold text-foreground/80">
            No public playlists yet
          </p>
          <p className="text-xs text-foreground/50 mt-1">
            Add friends in Settings and they can share public playlists with you.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.friendId} className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">
              {group.username}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {group.playlists.map((playlist) => (
                <Link
                  key={playlist._id}
                  href={`/dashboard/library/playlist/${playlist._id}`}
                  className="group relative cursor-pointer rounded-md transition-colors"
                >
                  <div className="relative aspect-square w-full rounded-md overflow-hidden bg-foreground/5 border border-foreground/10 flex items-center justify-center shadow-sm mb-3">
                    {playlist.coverUrl ? (
                      <Image
                        width={500}
                        height={500}
                        unoptimized
                        src={playlist.coverUrl}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        alt={playlist.name}
                      />
                    ) : (
                      <ListMusic size={48} className="text-foreground/30" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-foreground capitalize truncate">
                    {playlist.name}
                  </h3>
                  <p className="text-xs font-medium text-foreground/50 mt-0.5">
                    {playlist.trackCount === 1
                      ? "1 song"
                      : `${playlist.trackCount} songs`}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
