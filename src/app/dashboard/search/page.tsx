"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Track } from "@/components/TrackComponent";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";

interface SearchResultItem {
  _id?: string;
  id?: string;
  youtubeId?: string;
  title?: string;
  artist?: string;
  uploaderName?: string;
  coverUrl?: string;
  thumbnail?: string;
  audioUrl?: string;
  url?: string;
  duration?: number | string;
  isOfficial?: boolean;
}

interface ArtistResult {
  name: string;
  avatarUrl: string;
}

interface SearchResponse {
  items?: SearchResultItem[];
  artists?: {
    name?: string;
    avatarUrl?: string;
    thumbnail?: string;
  }[];
}

interface DonePhase {
  status: "done";
  query: string;
  items: SearchResultItem[];
  artists: ArtistResult[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [phase, setPhase] = useState<DonePhase>({
    status: "done",
    query: "",
    items: [],
    artists: [],
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const active = phase.query === query ? phase : null;
  const ytResults = active?.items ?? [];
  const artists = active?.artists ?? [];
  const isSearchingYt = query !== "" && active === null;

  useEffect(() => {
    if (!query) return;
    let cancelled = false;

    fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json().catch(() => ({ items: [], artists: [] })))
      .then((data: SearchResponse) => {
        if (cancelled) return;

        const top6Songs = (data.items ?? []).slice(0, 6).map((item) => ({
          ...item,
          _id: item._id || item.youtubeId || item.id,
          youtubeId: item.youtubeId || item.id,
          coverUrl:
            item.coverUrl ||
            item.thumbnail ||
            `https://i.ytimg.com/vi/${item.youtubeId || item.id}/hqdefault.jpg`,
        }));

        const artistMap = new Map<string, ArtistResult>();

        if (data.artists && Array.isArray(data.artists)) {
          data.artists.forEach((a) => {
            if (a.name) {
              artistMap.set(a.name.toLowerCase().trim(), {
                name: a.name,
                avatarUrl: a.avatarUrl || a.thumbnail || "",
              });
            }
          });
        }

        top6Songs.forEach((song) => {
          const artistName = song.artist || song.uploaderName;
          if (artistName && !artistMap.has(artistName.toLowerCase().trim())) {
            artistMap.set(artistName.toLowerCase().trim(), {
              name: artistName,
              avatarUrl: song.coverUrl || "",
            });
          }
        });

        setPhase({
          status: "done",
          query,
          items: top6Songs,
          artists: Array.from(artistMap.values()).slice(0, 6),
        });
      })
      .catch((error) => {
        console.error("Search failed:", error);
        if (!cancelled) {
          setPhase({ status: "done", query, items: [], artists: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="p-3 max-w-4xl mx-auto pt-4 md:pt-6 text-foreground antialiased pb-28">
      <div className="block md:hidden mb-6 z-50 relative">
        <GlobalSearchBar />
      </div>

      {!query && !isSearchingYt ? (
        <div className="flex flex-col items-center justify-center h-[40vh] text-foreground/30 font-mono text-xs tracking-widest uppercase">
          Search for songs or artists
        </div>
      ) : (
        <div className="space-y-10">
          {(ytResults.length > 0 || isSearchingYt) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between pb-2 px-1">
                <h3 className="font-black uppercase text-primary">
                  {isSearchingYt ? "Searching..." : `Songs`}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
                {ytResults.map((track) => {
                  const videoId =
                    track.url?.split("?v=")[1] || track.youtubeId || track.id;
                  return (
                    <Track
                      key={videoId}
                      track={track}
                      index={undefined}
                      variant="row"
                      loadingId={loadingId}
                      setLoadingId={setLoadingId}
                    />
                  );
                })}

                {isSearchingYt &&
                  Array.from({ length: 6 - ytResults.length }).map((_, i) => (
                    <div
                      key={`skeleton-${i}`}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-foreground/[0.02] border border-foreground/5 opacity-60"
                    >
                      <div className="w-10 h-10 rounded bg-foreground/10 animate-pulse shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-3.5 bg-foreground/20 rounded w-3/4 animate-pulse" />
                        <div className="h-2.5 bg-foreground/10 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {artists.length > 0 && !isSearchingYt && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <h3 className="font-black uppercase text-primary">Artists</h3>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {artists.map((artist, idx) => (
                  <Link
                    key={idx}
                    href={`/dashboard/artist/${encodeURIComponent(artist.name)}`}
                    className="group flex flex-col items-center gap-2 p-2 rounded-2xl cursor-pointer transition-all text-center"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-foreground/10 border border-foreground/10 shadow-sm shrink-0">
                      {artist.avatarUrl ? (
                        <Image width={500} height={500} unoptimized
                          src={artist.avatarUrl}
                          alt={artist.name}
                          className="w-full select-none h-full object-cover transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 font-bold text-xl">
                          {artist.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-xs text-foreground/80 group-hover:text-foreground truncate w-full transition-colors">
                      {artist.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
