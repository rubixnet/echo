"use client";

import { use, useEffect, useState } from "react";
import { Track } from "@/components/TrackComponent";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { Play, Shuffle, Music2, Plus, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

interface ArtistData {
  name: string;
  artistId: string;
  coverUrl: string;
  topSongs: any[];
  albums: any[];
  songs: any[];
}

export default function ArtistPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = use(params);
  const rawName = resolvedParams.name;
  const artistName = decodeURIComponent(rawName || "");
  const user = useUser()

  const [artistData, setArtistData] = useState<ArtistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggleSaveLibraryItem = useMutation(api.library.toggleSaveItem);

  const { playTrack } = useGlobalPlayback();

  useEffect(() => {
    async function fetchArtist() {
      if (!artistName) return;
      setIsLoading(true);

      try {
        const res = await fetch(`/api/youtube/artist?name=${encodeURIComponent(artistName)}`);
        if (res.ok) {
          const data = await res.json();
          setArtistData(data);
        }
      } catch (error) {
        console.error("Failed to fetch artist profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArtist();
  }, [artistName]);

  const handleToggleLibrary = async () => {
    if (!user?._id || !artistData) return;
    await toggleSaveLibraryItem({
      userId: user._id as any,
      itemType: "artist",
      itemId: artistData.name,
      title: artistData.name,
      coverUrl: artistData?.coverUrl,
    });
  };

  const handlePlayAll = () => {

    if (artistData?.topSongs && artistData.topSongs.length > 0) {
      playTrack(artistData.topSongs[0], setLoadingId, artistData.topSongs, 0);
    }
  };

  const handleShuffle = () => {
    if (artistData?.topSongs && artistData.topSongs.length > 0) {
      const shuffled = [...artistData.topSongs].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], setLoadingId, shuffled, 0);
    }
  };

  const isBookmarked = useQuery(
    api.library.checkSaved,
    user?._id ? { userId: user._id as any, itemType: "artist", itemId: artistName } : "skip"
  )

  const addToLibrary = async () => {

  }

  if (isLoading) {
    return (
      <ArtistPageSkeleton />
    );
  }

  if (!artistData) {
    return (
      <div className="w-full py-20 text-center text-foreground/50 font-medium">
        Artist could not be found.
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground pb-32">
      <div className="relative w-full h-[35vh] md:h-[45vh] -mt-20 flex items-end px-6 md:px-12 pb-10 overflow-hidden ">
        {artistData.coverUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center dark:opacity-25 blur-lg scale-110"
            style={{ backgroundImage: `urlme}(${artistData.coverUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />

        <div className="relative z-20 flex items-end gap-6 max-w-5xl">


          {artistData.coverUrl && (
            <img
              src={artistData.coverUrl}
              alt={artistData.name}
              className="w-28 h-28 select-none md:w-40 md:h-40 rounded-full object-cover border-2 border-foreground/10 shrink-0"
            />
          )}

          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-6xl text-balance font-black tracking-tighter leading-none text-foreground">
              {artistData.name}
            </h1>

            <div className="flex items-center gap-3 mt-4">
              <Button
                onClick={handlePlayAll}
                className="w-11 px-0 shadow-none sm:w-auto sm:px-5"
                disabled={artistData.topSongs.length === 0}
              >
                <Play size={20} className="fill-current " />
                <span className="hidden sm:block">
                  Play
                </span>
              </Button>
              <Button
                onClick={handleShuffle}
                disabled={artistData.topSongs.length === 0}
                className="w-11 shadow-none px-0"
              >
                <Shuffle size={18} />
              </Button>
              <Button
                onClick={(e: any) => {
                  e.stopPropagation();
                  handleToggleLibrary();
                }}
                disabled={artistData.topSongs.length === 0}
                className="w-11 shadow-none px-0"
              >
                <Bookmark size={18} className={cn("transition-colors", isBookmarked ? "fill-primary text-primary" : "text-primary/80")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto space-y-12">
        <section>
          <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Music2 size={18} className="text-emerald-500" /> Top Songs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
            {artistData.topSongs.map((track, index) => (
              <Track
                key={track.id || index}
                track={track}
                showDuration={false}
                variant="row"
                loadingId={loadingId}
                setLoadingId={setLoadingId}
              />
            ))}
          </div>
        </section>

        {artistData.songs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold tracking-tight mb-4">Singles & Popular Releases</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
              {artistData.songs.map((track, index) => (
                <Track
                  key={track.id || index}
                  track={track}
                  variant="row"
                  showDuration={false}
                  loadingId={loadingId}
                  setLoadingId={setLoadingId}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ArtistPageSkeleton() {
  return (
    <div className="w-full min-h-full p-6 md:p-10 pb-32 text-foreground bg-background">
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 mb-8">
        <div className="mx-2">
          <div className="flex flex-row gap-2">
            <div className="w-28 h-28 md:w-40 md:h-40 shrink-0 bg-foreground/10 rounded-full animate-pulse" />

            <div className="flex flex-col gap-3 flex-1 min-w-0 justify-end">
              <div className="h-11 mt-2 md:hidden w-3/4  bg-foreground/10 rounded-md animate-pulse" />

              <div className='gap-3 flex md:hidden mt-2 mx-1'>
                <div className="h-11 w-11 bg-foreground/10 rounded-full animate-pulse" />
                <div className="h-11 w-11 bg-foreground/10 rounded-full animate-pulse" />
                <div className="h-11 w-11 bg-foreground/10 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-2 flex-1 min-w-0 justify-end">
          <div className="h-14 hidden md:block w-2/3 bg-foreground/10 rounded-md animate-pulse" />
          <div className=' gap-3 md:flex hidden'>
            <div className="h-11 w-24 bg-foreground/10 rounded-full animate-pulse" />
            <div className="h-11 w-11 bg-foreground/10 rounded-full animate-pulse" />
            <div className="h-11 w-11 bg-foreground/10 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      <div className="h-8 mt-15 mb-4 mx-2 w-30 bg-foreground/10 rounded-md animate-pulse" />

      <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <TrackRowSkeleton key={i} />
        ))}
      </div>

      <div className="h-8 mt-15 mb-4 mx-2 w-50 bg-foreground/10 rounded-md animate-pulse" />

      <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <TrackRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-2 py-2.5 rounded-md border-b border-foreground/5 sm:border-none">
      <div className="w-10 h-10 bg-foreground/10 rounded-md animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 w-1/3 bg-foreground/10 rounded-sm animate-pulse" />
        <div className="h-3 w-1/5 bg-foreground/10 rounded-sm animate-pulse" />
      </div>
      <div className="w-2 h-5 bg-foreground/10 rounded-sm animate-pulse shrink-0" />
    </div>
  );
}
