import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useUser } from "@/hooks/useUser";
import { useUserExclusions } from "@/hooks/useUserExclusions";
import { useRoomContext } from "@/hooks/useRoomContext";
import {
  normalizeTrack,
  type NormalizableTrack,
  type QueueItem,
  type QueueType,
} from "@/lib/trackUtils";
import { decideSameTrackAction } from "@/lib/roomFollow";
import { fetchRelatedTracks } from "@/lib/fetchRelatedTracks";
import { useRef, useCallback } from "react";

export type { QueueType };

type PlayableTrack = NormalizableTrack & {
  thumbnails?: string | { url?: string }[];
  image?: string;
};

export function useGlobalPlayback() {
  const user = useUser();
  const userId = user?._id;
  const {
    forceSync,
    loadTrack,
    currentTrackUrl,
    setActiveMetadata,
    setIsLoading,
    queue,
    queueIndex,
    setQueue,
    setQueueIndex,
    currentTimeSec,
    durationSec,
    isPlaying: localIsPlaying,
    seekToTime,
    isOnLoop,
    activeMetadata,
  } = useAudioEngine();

  const { exclusionSet } = useUserExclusions();
  const {
    isInRoom,
    isHost,
    isGuest,
    roomId,
    controlTogglePlay,
    controlRestart,
    openLockdown,
  } = useRoomContext();

  const ensureYoutubeTrack = useMutation(api.tracks.ensureYoutubeTrack);
  const updateRoomTrack = useMutation(api.rooms.updateRoomTrack);
  const failureCountRef = useRef(0);

  const broadcastTrackChange = useCallback(
    async (trackId: string | undefined) => {
      if (!isInRoom) return;
      if (isGuest) return;
      if (!roomId) return;
      try {
        await updateRoomTrack({
          roomId,
          trackId,
          userId,
        });
      } catch {
      }
    },
    [isInRoom, isGuest, roomId, userId, updateRoomTrack],
  );

  const playTrack = async (
    ytTrack?: PlayableTrack | null,
    setLoadingId?: (id: string | null) => void,
    queueList?: QueueItem[],
    newQueueIndex?: number,
  ) => {
    if (!ytTrack) return;

    if (isGuest && isInRoom) {
      openLockdown();
      return;
    }

    const normalized = normalizeTrack(ytTrack);
    const videoId = normalized.id;

    if (!videoId) {
      console.error("[playTrack] Failed to extract valid YouTube ID:", ytTrack);
      return;
    }

    setIsLoading(true);
    if (setLoadingId) setLoadingId(videoId);

    if (queueList && newQueueIndex !== undefined) {
      setQueue(queueList);
      setQueueIndex(newQueueIndex);
    } else if (!queueList) {
      setQueue([{ ...normalized, queueType: "user" as QueueType }]);
      setQueueIndex(0);
    }

    try {
      const pipeUrl = `/api/youtube/stream?id=${videoId}`;
      let coverUrl =
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop";

      if (ytTrack.thumbnail) coverUrl = ytTrack.thumbnail;
      else if (ytTrack.coverUrl) coverUrl = ytTrack.coverUrl;
      else if (typeof ytTrack.thumbnails === "string")
        coverUrl = ytTrack.thumbnails;
      else if (
        Array.isArray(ytTrack.thumbnails) &&
        ytTrack.thumbnails.length > 0
      ) {
        const firstThumb = ytTrack.thumbnails[0];
        coverUrl =
          (typeof firstThumb === "string" ? firstThumb : firstThumb.url) ||
          coverUrl;
      } else if (ytTrack.image) coverUrl = ytTrack.image;

      if (currentTrackUrl === pipeUrl) {
        const action = decideSameTrackAction(
          localIsPlaying,
          currentTimeSec,
          durationSec,
        );
        if (action === "restart") controlRestart();
        else controlTogglePlay();
        return;
      }

      const metadata = {
        title: ytTrack.title || "Unknown Title",
        artist: ytTrack.uploaderName || ytTrack.artist || "Unknown Artist",
        coverUrl,
        audioUrl: pipeUrl,
        trackId: videoId,
      };

      loadTrack(pipeUrl, metadata);

      const durationStr =
        typeof ytTrack.duration === "number"
          ? `${Math.floor(ytTrack.duration / 60)}:${Math.floor(
            ytTrack.duration % 60,
          )
            .toString()
            .padStart(2, "0")}`
          : ytTrack.duration || "0:00";

      const trackId = await ensureYoutubeTrack({
        trackId: videoId,
        title: metadata.title,
        artist: metadata.artist,
        audioUrl: pipeUrl,
        coverUrl,
        duration: durationStr,
      });

      setActiveMetadata(trackId ? { ...metadata, id: trackId } : metadata);

      await broadcastTrackChange(trackId ?? undefined);

      failureCountRef.current = 0;
    } catch (error) {
      console.error("Playback failed for ID:", videoId, error);
      handleTrackFailure();
    } finally {
      setIsLoading(false);
      if (setLoadingId) setLoadingId(null);
    }
  };

  const handleTrackFailure = () => {
    failureCountRef.current += 1;
    if (failureCountRef.current > 3) {
      console.error("Max retry threshold reached. Stopping playback.");
      setIsLoading(false);
      return;
    }
    console.warn(
      `Skipping failed track (Attempt ${failureCountRef.current})...`,
    );
    playNext(true);
  };

  const playNext = async (isAutomatic: boolean = false) => {
    if (isGuest && isInRoom) {
      openLockdown();
      return;
    }

    if (isAutomatic && isOnLoop) {
      forceSync(undefined, 0, true);
      if (isHost && isInRoom && roomId && activeMetadata?.id) {
        updateRoomTrack({
          roomId,
          trackId: activeMetadata.id,
          userId,
        }).catch(() => { });
      }
      return;
    }

    if (queue && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      playTrack(queue[nextIndex], undefined, queue, nextIndex);
      return;
    }

    if (activeMetadata) {
      const currentId =
        activeMetadata.trackId ||
        activeMetadata.id ||
        activeMetadata.audioUrl?.split("id=")[1];

      if (!currentId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const recommendations = await fetchRelatedTracks(currentId, {
          existingQueue: queue,
          userExclusions: exclusionSet,
        });

        if (recommendations.length > 0) {
          const nextSong = recommendations[0];
          const currentQueue = queue || [activeMetadata];
          const nextIndex = currentQueue.length;
          playTrack(
            nextSong,
            undefined,
            [...currentQueue, ...recommendations],
            nextIndex,
          );
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch related track:", error);
        setIsLoading(false);
      }
    }
  };

  const playPrevious = () => {
    if (isGuest && isInRoom) {
      openLockdown();
      return;
    }
    if (currentTimeSec > 3) {
      seekToTime(0);
    } else if (queue && queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      playTrack(queue[prevIndex], undefined, queue, prevIndex);
    }
  };

  const playNextPriority = (track: NormalizableTrack) => {
    if (isGuest && isInRoom) {
      openLockdown();
      return;
    }
    const normalized = {
      ...normalizeTrack(track),
      queueType: "user" as QueueType,
    };
    if (!queue || queue.length === 0) {
      playTrack(normalized);
      return;
    }

    const newQueue = [...queue];
    newQueue.splice(queueIndex + 1, 0, normalized);
    setQueue(newQueue);
  };

  const addToQueue = (track: NormalizableTrack) => {
    if (isGuest && isInRoom) {
      openLockdown();
      return;
    }
    const normalized = {
      ...normalizeTrack(track),
      queueType: "user" as QueueType,
    };
    if (!queue || queue.length === 0) {
      playTrack(normalized);
      return;
    }

    const newQueue = [...queue];
    let insertIndex = newQueue.length;

    for (let i = queueIndex + 1; i < newQueue.length; i++) {
      if (newQueue[i]?.queueType === "recommendation") {
        insertIndex = i;
        break;
      }
    }

    newQueue.splice(insertIndex, 0, normalized);
    setQueue(newQueue);
  };

  return {
    playTrack,
    playPrevious,
    playNext,
    playNextPriority,
    addToQueue,
    handleTrackFailure,
    isHost,
    isGuest,
    isInRoom,
  };
}
