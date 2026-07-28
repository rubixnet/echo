"use client";

import { use, useEffect, useState } from "react";
import { Music, TrendingUp } from "lucide-react";
import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";
import { Track } from "@/components/TrackComponent";
import { PLAYLIST_MAP } from "@/lib/yt-charts";

export default function TypePage({ params }: { params: Promise<{ type: string }> }) {
  const resolvedParams = use(params);
  const typeId = resolvedParams.type;

  const category = PLAYLIST_MAP.get(typeId);

  const [tracks, setTracks] = useState<TrackLike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!category?.playlistId) {
      setIsLoading(false);
      return;
    }

    async function fetchPlaylist() {
      setIsLoading(true);
      try {
        if (!category?.playlistId) return;
        const res = await fetch(`/api/youtube/playlist?playlistId=${category.playlistId}`);
        const data = await res.json();

        const mappedTracks: TrackLike[] = (data.tracks || []).map((t: any, idx: number) => ({
          _id: t.id || t.youtubeId || `track-${idx}`,
          youtubeId: t.youtubeId || t.id,
          title: t.title,
          artist: t.artist,
          thumbnail: t.thumbnail,
          duration: t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}` : "0:00",
          url: t.url,
        }));

        setTracks(mappedTracks);
      } catch (err) {
        console.error("Failed to fetch playlist via yt-dlp:", err);
        setTracks([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylist();
  }, [category?.playlistId]);

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-foreground/50">
        <p className="text-base font-bold">Category not found</p>
        <p className="text-xs text-foreground/40 mt-1">The route `{typeId}` is not in your playlist map.</p>
      </div>
    );
  }

  const handlePlayFirst = (sortedTracks: TrackLike[]) => {
    if (sortedTracks.length > 0) {
      console.log("Playing first track:", sortedTracks[0]);
    }
  };

  return (
    <PlaylistLayout
      title={category.name}
      subtitle={`Official ${category.type === "chart" ? "YouTube Music Chart" : "Genre Feed"} updated dynamically.`}
      coverNode={
        category.coverNode ? (
          <img src={category.coverNode} alt={category.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-foreground/5 text-foreground/40">
            {category.type === "chart" ? <TrendingUp size={48} /> : <Music size={48} />}
          </div>
        )
      }
      metaLine={
        <>
          <span className="capitalize font-bold text-foreground">{category.type}</span>
          <span className="text-foreground/40">•</span>
          <span>{tracks.length} tracks</span>
        </>
      }
      tracks={tracks}
      isLoading={isLoading}
      onPlayFirst={handlePlayFirst}
      emptyIcon={<Music className="mx-auto mb-4 text-foreground/30" size={48} />}
      emptyText="No songs found in this playlist."
      renderTrack={(track, index) => (
        <Track
          showDuration={false}
          key={track._id}
          track={track}
          index={index + 1}
          variant="row"
          loadingId={loadingId}
          setLoadingId={setLoadingId}
        />
      )}
    />
  );
}