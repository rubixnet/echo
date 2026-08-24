"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { History } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { Track } from "@/components/TrackComponent";
import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";

export default function ListeningHistoryPage() {
  const user = useUser();
  const { playTrack } = useGlobalPlayback();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const historySongs = useQuery(
    api.history.getUserHistory,
    user?._id ? { userId: user._id } : "skip",
  );

  const isLoading = historySongs === undefined;

  const totalDurationStr = useMemo(() => {
    if (!historySongs) return "0 min";
    const totalSeconds = historySongs.reduce((acc, track) => {
      if (!track?.duration) return acc;
      const [m, s] = track.duration.split(":").map(Number);
      return acc + (m || 0) * 60 + (s || 0);
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  }, [historySongs]);

  const handlePlayFirst = (sorted: TrackLike[]) => {
    const first = sorted[0];
    if (!first) return;
    playTrack(
      {
        ...first,
        youtubeId: first.audioUrl?.split("id=")[1] || first.youtubeId,
      },
      setLoadingId,
      sorted,
      0,
    );
  };

  const coverNode = (
    <div className="w-full h-full bg-radial-[at_top_left] from-cyan-400 via-teal-700 to-slate-950 flex items-center justify-center">
      <History size={125} className="text-white" />
    </div>
  );

  return (
    <PlaylistLayout
      coverNode={coverNode}
      title="Recently Played"
      metaLine={
        <>
          <span className="text-foreground">{user?.name || "You"}</span>
          <span className="text-foreground/40">•</span>
          <span>
            {historySongs?.length ?? 0} songs, {totalDurationStr}
          </span>
        </>
      }
      tracks={historySongs}
      isLoading={isLoading}
      onPlayFirst={handlePlayFirst}
      emptyIcon={
        <History className="mx-auto mb-4 text-foreground/30" size={48} />
      }
      emptyText="No history yet."
      renderTrack={(track, _allTracks, index) => (
        <div className="group items-center">
          <Track
            key={track._id}
            track={track}
            index={index + 1}
            variant="row"
            loadingId={loadingId}
            setLoadingId={setLoadingId}
          />
        </div>
      )}
    />
  );
}
