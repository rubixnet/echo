"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import {
  History,
  ListMusic,
  Pin,
  ChevronDown,
  ChevronUp,
} from "@/components/icons";
import { 
  Star, 
} from "lucide-react"
import {
  MoreVertical,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useLibraryData } from "@/hooks/useLibraryData";
import { useSearchFilter } from "@/hooks/useSearchFilter";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  LibrarySearchBar,
  LibraryFilter,
  SortOrder,
} from "@/components/LibrarySearchBar";
import { PlaylistContextMenu } from "@/components/PlaylistActions";
import { Track } from "@/components/TrackComponent";
import Link from "next/link";

const SECTION_LIMITS = {
  pins: 5,
  playlists: 8,
  tracks: 6,
  artists: 6,
};

export default function LibraryHubPage() {
  const user = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<{
    pins: boolean;
    playlists: boolean;
    tracks: boolean;
    artists: boolean;
  }>({
    pins: false,
    playlists: false,
    tracks: false,
    artists: false,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const {
    playlists = [],
    likedSongs = [],
    historySongs = [],
    libraryTracks = [],
    libraryArtists = [],
    isLoading,
  } = useLibraryData(user?._id);

  const searchedPlaylists = useSearchFilter(playlists, searchTerm, ["name"]);
  const searchedTracks = useSearchFilter(libraryTracks, searchTerm, [
    "title",
    "artist",
  ]);
  const searchedArtists = useSearchFilter(libraryArtists, searchTerm, ["title"]);

  const sortItems = useCallback(
    <T extends { name?: string; title?: string }>(
      items: T[],
    ): T[] => {
      return [...items].sort((a, b) => {
        const nameA = (a.name || a.title || "").toLowerCase();
        const nameB = (b.name || b.title || "").toLowerCase();
        return sortOrder === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    },
    [sortOrder],
  );

  const filteredPlaylists = useMemo(
    () => sortItems(searchedPlaylists),
    [searchedPlaylists, sortItems],
  );

  const filteredTracks = useMemo(
    () => sortItems(searchedTracks),
    [searchedTracks, sortItems],
  );

  const filteredArtists = useMemo(
    () => sortItems(searchedArtists),
    [searchedArtists, sortItems],
  );

  const pinnedPlaylists = useMemo(
    () => filteredPlaylists.filter((p) => p.isPinned),
    [filteredPlaylists],
  );

  const isSearching = Boolean(searchTerm.trim());

  const displayedPins = expandedSections.pins
    ? pinnedPlaylists
    : pinnedPlaylists.slice(0, SECTION_LIMITS.pins);

  const showCustomCards =
    !isSearching && (activeFilter === "all" || activeFilter === "playlists");
  const customCardsCount = showCustomCards
    ? (historySongs.length > 0 ? 1 : 0) + (likedSongs.length > 0 ? 1 : 0)
    : 0;

  const availablePlaylistSlots = Math.max(
    0,
    SECTION_LIMITS.playlists - customCardsCount,
  );
  const displayedPlaylists = expandedSections.playlists
    ? filteredPlaylists
    : filteredPlaylists.slice(0, availablePlaylistSlots);

  const totalLibraryItems = customCardsCount + filteredPlaylists.length;

  const displayedTracks = expandedSections.tracks
    ? filteredTracks
    : filteredTracks.slice(0, SECTION_LIMITS.tracks);

  const displayedArtists = expandedSections.artists
    ? filteredArtists
    : filteredArtists.slice(0, SECTION_LIMITS.artists);

  const showPins =
    (activeFilter === "all" || activeFilter === "pins") &&
    pinnedPlaylists.length > 0;
  const showPlaylists =
    (activeFilter === "all" || activeFilter === "playlists") &&
    (filteredPlaylists.length > 0 || showCustomCards);
  const showTracks =
    (activeFilter === "all" || activeFilter === "songs") &&
    filteredTracks.length > 0;
  const showArtists =
    (activeFilter === "all" || activeFilter === "artists") &&
    filteredArtists.length > 0;

  const hasAnyResults = showPins || showPlaylists || showTracks || showArtists;

  return (
    <div className="px-6 lg:px-12 py-8 pb-12 space-y-12 bg-background text-foreground max-w-7xl mx-auto">
      <LibrarySearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        sortOrder={sortOrder}
        onToggleSort={toggleSort}
      />

      {isLoading ? (
        <LibraryContentSkeleton />
      ) : !hasAnyResults && (isSearching || activeFilter !== "all") ? (
        <div className="py-24 text-center">
          <p className="text-base font-semibold text-foreground/80">
            No {activeFilter !== "all" ? activeFilter : "library"} results found{" "}
            {searchTerm && `for "${searchTerm}"`}
          </p>
          <p className="text-xs text-foreground/50 mt-1">
            Check your spelling or try changing your active filter.
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {showPins && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Pins</h2>
                {pinnedPlaylists.length > SECTION_LIMITS.pins && (
                  <AccordionToggle
                    isExpanded={expandedSections.pins}
                    onToggle={() => toggleSection("pins")}
                    count={pinnedPlaylists.length}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {displayedPins.map((p) => (
                  <LibraryPlaylistItem key={p._id} playlist={p} />
                ))}
              </div>
            </section>
          )}

          {showPlaylists && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Your Library</h2>
                {totalLibraryItems > SECTION_LIMITS.playlists && (
                  <AccordionToggle
                    isExpanded={expandedSections.playlists}
                    onToggle={() => toggleSection("playlists")}
                    count={totalLibraryItems}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {showCustomCards && historySongs.length > 0 && (
                  <div
                    onClick={() => router.push(`/dashboard/library/history`)}
                    className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
                  >
                    <div className="aspect-square w-full rounded-md overflow-hidden bg-radial-[at_top_left] from-cyan-400 via-teal-700 to-slate-950 flex items-center justify-center shadow-sm mb-3">
                      <History
                        size={56}
                        className="fill-transparent text-white drop-shadow-md"
                      />
                    </div>
                    <h3 className="font-bold text-sm text-foreground truncate">
                      Recently Played
                    </h3>
                    <p className="text-xs font-medium text-foreground/50 mt-0.5">
                      {historySongs.length === 1
                        ? "1 song"
                        : `${historySongs.length} songs`}
                    </p>
                  </div>
                )}

                {showCustomCards && likedSongs.length > 0 && (
                  <div
                    onClick={() => router.push(`/dashboard/library/liked`)}
                    className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
                  >
                    <div className="aspect-square w-full rounded-md overflow-hidden bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-sm mb-3">
                      <Star
                        size={80}
                        className="fill-white text-white drop-shadow-md"
                      />
                    </div>
                    <h3 className="font-bold text-sm text-foreground truncate">
                      Favorite Songs
                    </h3>
                    <p className="text-xs font-medium text-foreground/50 mt-0.5">
                      {likedSongs.length === 1
                        ? "1 song"
                        : `${likedSongs.length} songs`}
                    </p>
                  </div>
                )}

                {displayedPlaylists.map((p) => (
                  <LibraryPlaylistItem key={p._id} playlist={p} />
                ))}
              </div>

              {filteredPlaylists.length === 0 && !showCustomCards && (
                <div className="py-8 text-sm font-medium text-foreground/50">
                  No matching playlists.
                </div>
              )}
            </section>
          )}

          {showTracks && (
            <section className="space-y-4" id="songs">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">
                  {isSearching ? "Matching Songs" : "Recently Saved Songs"}
                </h2>
                {filteredTracks.length > SECTION_LIMITS.tracks && (
                  <AccordionToggle
                    isExpanded={expandedSections.tracks}
                    onToggle={() => toggleSection("tracks")}
                    count={filteredTracks.length}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-1">
                {displayedTracks.map((track, index) => (
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

          {showArtists && (
            <section className="space-y-4" id="artists">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Artists</h2>
                {filteredArtists.length > SECTION_LIMITS.artists && (
                  <AccordionToggle
                    isExpanded={expandedSections.artists}
                    onToggle={() => toggleSection("artists")}
                    count={filteredArtists.length}
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                {displayedArtists.map((artist, idx) => (
                  <Link
                    key={idx}
                    href={`/dashboard/artist/${encodeURIComponent(artist.title)}`}
                    className="group flex flex-col text-center gap-4 p-2 rounded-2xl cursor-pointer transition-all"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:h-30 md:w-30 lg:w-40 lg:h-40 rounded-full overflow-hidden bg-foreground/10 border border-foreground/10 shadow-sm shrink-0">
                      {artist.coverUrl ? (
                        <Image
                          width={500}
                          height={500}
                          unoptimized
                          src={artist.coverUrl}
                          alt={artist.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-bold text-xl">
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
      )}
    </div>
  );
}

function AccordionToggle({
  isExpanded,
  onToggle,
  count,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-foreground/5"
    >
      <span>{isExpanded ? "Show Less" : `Show All (${count})`}</span>
      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
    </button>
  );
}

type LibraryPlaylist = Doc<"playlists"> & {
  coverUrl?: string | null;
  trackCount?: number;
};

function LibraryPlaylistItem({ playlist }: { playlist: LibraryPlaylist }) {
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
          <Image
            width={500}
            height={500}
            unoptimized
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
          <h3 className="font-bold text-sm text-foreground capitalize truncate">
            {playlist.name}
          </h3>
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

function LibraryContentSkeleton() {
  return (
    <div className="space-y-12">
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