"use client";

import { use, useMemo, useState } from "react";
import { Music, TrendingUp } from "lucide-react";
import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";
import { Track } from "@/components/TrackComponent";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";

export default function TypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const resolvedParams = use(params);
  const typeId = resolvedParams.type;

  const categories = useQuery(api.syncPlaylists.getCategories);
  const dbTracks = useQuery(api.syncPlaylists.getCategoryTracks, {
    categoryId: typeId,
  });

  const category = categories?.find((c) => c.categoryId === typeId);

  const tracks: TrackLike[] = useMemo(() => {
    if (!dbTracks) return [];

    return dbTracks.map((t, idx) => ({
      _id: t._id || t.trackId || `track-${idx}`,
      id: t._id || t.trackId || `track-${idx}`,
      trackId: t.trackId,
      title: t.title || "Untitled Track",
      artist: t.artist || "Unknown Artist",
      thumbnail: t.thumbnail,
      coverUrl: t.thumbnail,
      duration: t.duration || "3:30",
      url: `https://www.youtube.com/watch?v=${t.trackId}`,
    }));
  }, [dbTracks]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { playTrack } = useGlobalPlayback();

  const isLoading = dbTracks === undefined || categories === undefined;

  if (!isLoading && !category) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-foreground/50">
        <p className="text-base font-bold">Category not found</p>
        <p className="text-xs text-foreground/40 mt-1">
          The category `{typeId}` does not exist in your database.
        </p>
      </div>
    );
  }

  const handlePlayFirst = (sortedTracks: TrackLike[]) => {
    const first = sortedTracks[0];
    if (!first) return;

    playTrack(first, setLoadingId, sortedTracks, 0);
  };

  const categoryName = category?.name || typeId.toUpperCase();
  const categoryType = category?.type || "chart";

  return (
    <PlaylistLayout
      title={categoryName}
      subtitle={`Official ${
        categoryType === "chart" ? "YouTube Music Chart" : "Genre Feed"
      } updated dynamically.`}
      coverNode={
        <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-foreground/40">
          {categoryType === "chart" ? (
            <TrendingUp size={48} />
          ) : (
            <Music size={48} />
          )}
        </div>
      }
      metaLine={
        <>
          <span className="capitalize font-bold text-foreground">
            {categoryType}
          </span>
          <span className="text-foreground/40">•</span>
          <span>{tracks.length} tracks</span>
        </>
      }
      tracks={tracks}
      isLoading={isLoading}
      onPlayFirst={handlePlayFirst}
      emptyIcon={
        <Music className="mx-auto mb-4 text-foreground/30" size={48} />
      }
      emptyText="No songs found in this category."
      renderTrack={(track) => (
        <Track
          showDuration={true}
          key={track._id}
          track={track}
          variant="row"
          loadingId={loadingId}
          setLoadingId={setLoadingId}
        />
      )}
    />
  );
}
