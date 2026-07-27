"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Pin, ChevronDown, ListMusic, Disc3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Track } from "@/components/TrackComponent";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";

export default function LibraryHubPage() {
  const user = useUser();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [isPinnedExpanded, setIsPinnedExpanded] = useState(false);

  const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip");
  const likedSongs = useQuery(api.likes.getMyLikes, user?._id ? { userId: user._id } : "skip");

  if (playlists === undefined || likedSongs === undefined) {
    return (
      <div className="flex justify-center py-20 bg-background">
        <Loader2 className="animate-spin text-highlight" size={32} />
      </div>
    );
  }

  const pinnedItems = playlists.slice(0, 6);
  const visiblePinned = isPinnedExpanded ? pinnedItems : pinnedItems.slice(0, 4);

  return (
    <div className="space-y-12 mx-12 pb-20 bg-background text-foreground">

      <section className="space-y-4">
        <div className="flex items-center justify-between">


          {pinnedItems.length > 4 && (
            <button
              onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
              className="text-xs font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1"
            >
              {isPinnedExpanded ? "Show Less" : "Show All"}
              <ChevronDown size={14} className={cn("transition-transform duration-300", isPinnedExpanded && "rotate-180")} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visiblePinned.map((playlist) => (
            <div
              key={playlist._id}
              onClick={() => router.push(`/dashboard/library/playlist/${playlist._id}`)}
              className="group cursor-pointer hover:bg-foreground/5 p-3 transition-all"
            >
              <div className="aspect-square w-full overflow-hidden mb-3 relative shadow-sm">
                <img src={playlist.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256"} className="w-full h-full object-cover transition-transform" alt="" />
              </div>
              <h3 className="font-bold text-sm text-foreground truncate">{playlist.name}</h3>
              <p className="text-xs font-medium text-foreground/50 mt-0.5 flex items-center gap-1.5">
                <ListMusic size={12} /> Playlist
              </p>
            </div>
          ))}

        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight text-foreground">Recently Saved Songs</h2>
        </div>

        {likedSongs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-foreground/10 bg-card rounded-2xl">
            <p className="font-bold text-foreground/60">No songs saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1">
            {likedSongs.map((track, index) => (
              <Track
                key={track._id}
                track={track}
                index={index + 1}
                variant="row"
                loadingId={loadingId}
                setLoadingId={setLoadingId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}