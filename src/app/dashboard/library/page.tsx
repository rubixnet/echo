"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { History, Star, ListMusic, Pin, MoreVertical } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useLibraryData } from "@/hooks/useLibraryData";
import { PlaylistContextMenu } from "@/components/PlaylistActions";
import { Track } from "@/components/TrackComponent";
import Link from "next/link";

export default function LibraryHubPage() {
  const user = useUser();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { playlists, likedSongs, historySongs, libraryTracks, libraryArtists, isLoading } = useLibraryData(user?._id);
  const pinnedPlaylist = playlists.filter((p) => p.isPinned);

  if (isLoading) {
    return <LibrarySkeleton />;
  }

  return (
    <div className="px-6 lg:px-12 py-8 pb-12 space-y-12 bg-background text-foreground max-w-7xl mx-auto">
      {pinnedPlaylist.length > 0 &&
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Pins</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {pinnedPlaylist.map((p) => (
              <LibraryPlaylistItem key={p._id} playlist={p} />
            ))}
          </div>
        </section>
      }

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Your Library</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {historySongs.length > 0 && (
            <div
              onClick={() => router.push(`/dashboard/library/history`)}
              className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
            >
              <div className="aspect-square w-full rounded-md overflow-hidden bg-radial-[at_top_left] from-cyan-400 via-teal-700 to-slate-950 flex items-center justify-center shadow-sm mb-3">
                <History size={56} className="fill-transparent text-white drop-shadow-md" />
              </div>
              <h3 className="font-bold text-sm text-foreground truncate">Recently Played</h3>
              <p className="text-xs font-medium text-foreground/50 mt-0.5">
                {historySongs.length === 1 ? "1 song" : `${historySongs.length} songs`}
              </p>
            </div>
          )}

          {likedSongs.length > 0 && (
            <div
              onClick={() => router.push(`/dashboard/library/liked`)}
              className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
            >
              <div className="aspect-square w-full rounded-md overflow-hidden bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-sm mb-3">
                <Star size={56} className="fill-white text-white drop-shadow-md" />
              </div>
              <h3 className="font-bold text-sm text-foreground truncate">Favorite Songs</h3>
              <p className="text-xs font-medium text-foreground/50 mt-0.5">
                {likedSongs.length === 1 ? "1 song" : `${likedSongs.length} songs`}
              </p>
            </div>
          )}

          {playlists.map((p) => (
            <LibraryPlaylistItem key={p._id} playlist={p} />
          ))}
        </div>

        {playlists.length === 0 && historySongs.length === 0 && likedSongs.length === 0 && (
          <div className="py-8 text-sm font-medium text-foreground/50">
            Your library is empty.
          </div>
        )}
      </section>

      {libraryTracks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Recently Saved Songs</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1">
            {libraryTracks.map((track, index) => (
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
        </section>
      )}

      {libraryArtists.length > 0 && (
        <section className="space-y-4" >
          <div>
            <h2 className="text-xl font-bold tracking-tight">Artists</h2>
          </div>

          <div className='flex gap-6'>
            {libraryArtists.map((artist, idx) => (
              <Link
                key={idx}
                href={`/dashboard/artist/${encodeURIComponent(artist.title)}`}
                className="group flex flex-col text-center gap-4 p-2 rounded-2xl cursor-pointer transition-all"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:h-30 md:w-30 lg:w-40 lg:h-40 rounded-full overflow-hidden bg-foreground/10 border border-foreground/10 shadow-sm shrink-0">
                  {artist.coverUrl ? (
                    <img
                      src={artist.coverUrl}
                      alt={artist.title}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex justify-center bg-emerald-500/10 text-emerald-500 font-bold text-xl">
                      {artist.title[0]}
                    </div>
                  )}
                </div>
                <span className="font-semibold text-xs text-foreground/80 group-hover:text-foreground truncate w-full transition-colors">
                  {artist.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LibraryPlaylistItem({ playlist }: { playlist: any }) {
  const router = useRouter();

  const trackCount = playlist.trackCount || 0;
  const coverUrl = playlist.coverUrl;

  return (
    <div
      onClick={() => router.push(`/dashboard/library/playlist/${playlist._id}`)}
      className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
    >
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-foreground/5 border border-foreground/10 flex items-center justify-center shadow-sm mb-3">
        {coverUrl ? (
          <img
            src={coverUrl}
            className="w-full h-full object-cover"
            alt={playlist.name}
          />
        ) : (
          <ListMusic size={48} className="text-foreground/30" />
        )}

        {playlist.isPinned && (
          <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-md p-1.5 rounded-full shadow-md text-foreground">
            <Pin size={12} className="fill-current" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-foreground capitalize truncate">{playlist.name}</h3>
          <p className="text-xs font-medium text-foreground/50 mt-0.5">
            {trackCount === 1 ? "1 song" : `${trackCount} songs`}
          </p>
        </div>

        <PlaylistContextMenu playlist={playlist}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="p-1 -mr-1 text-foreground/50 hover:text-foreground rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
            aria-label="Playlist options"
          >
            <MoreVertical size={16} />
          </button>
        </PlaylistContextMenu>
      </div>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="px-6 lg:px-12 py-10 space-y-12 bg-background text-foreground max-w-7xl mx-auto">
      <section className="space-y-4">
        <div className="h-7 w-20 bg-foreground/10 rounded-md animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <LibraryPlaylistItemSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="h-7 w-36 bg-foreground/10 rounded-md animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <LibraryPlaylistItemSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="h-7 w-52 bg-foreground/10 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TrackRowSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LibraryPlaylistItemSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-square w-full rounded-md bg-foreground/10 animate-pulse" />
      <div className="h-4 w-3/4 bg-foreground/10 rounded-sm animate-pulse" />
      <div className="h-3 w-1/3 bg-foreground/10 rounded-sm animate-pulse" />
    </div>
  );
}

function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-10 h-10 rounded-md bg-foreground/10 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-foreground/10 rounded-sm animate-pulse" />
        <div className="h-3 w-1/4 bg-foreground/10 rounded-sm animate-pulse" />
      </div>
    </div>
  );
}