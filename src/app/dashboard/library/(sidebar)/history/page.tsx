"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import {
  History,
  Trash2,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { Button} from "@/components/ui/button";
import { Track } from "@/components/TrackComponent";
import { PlaylistLayout, TrackLike } from "@/components/PlaylistLayout";


export default function ListeningHistoryPage() {
  const user = useUser();
  const { playTrack } = useGlobalPlayback();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const removeHistoryItem = useMutation(api.history.removeHistoryItem);
  const historySongs = useQuery(
    api.history.getUserHistory,
    user?._id ? { userId: user._id } : "skip"
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
      sorted as any,
      0
    );
  };

  const handleRemoveFromHistory = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    track: any
  ) => {
    e.stopPropagation();
    if (!user?._id) return;
    try {
      await removeHistoryItem({ historyId: track._id });
    } catch (error) {
      console.error("Failed to remove song from history", error);
    }
  };

  const coverNode = (
    <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
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
      tracks={historySongs as any}
      isLoading={isLoading}
      onPlayFirst={handlePlayFirst}
      emptyIcon={<History className="mx-auto mb-4 text-foreground/30" size={48} />}
      emptyText="No history yet."
      renderTrack={(track, index) => (
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