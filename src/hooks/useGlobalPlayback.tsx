import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { useUser } from "@/hooks/useUser";
import { normalizeTrack } from "@/lib/trackUtils";
import { fetchRelatedTracks } from "@/lib/recommendations";
import { useRef } from "react";

export type QueueType = "user" | "recommendation";

export function useGlobalPlayback() {
  const user = useUser();
  const {
    forceSync,
    loadTrack,
    currentTrackUrl,
    togglePlay,
    setActiveMetadata,
    setIsLoading,
    queue,
    queueIndex,
    setQueue,
    setQueueIndex,
    currentTimeSec,
    seekToTime,
    isOnLoop,
    activeMetadata,
  } = useAudioEngine();

  const ensureYoutubeTrack = useMutation(api.tracks.ensureYoutubeTrack);
  const myRoom = useQuery(
    api.rooms.getMyHosterRooms,
    user?._id ? { userId: user._id } : "skip",
  );
  const updateRoomTrack = useMutation(api.rooms.updateRoomTrack);
  const failureCountRef = useRef(0);

  const playTrack = async (
    ytTrack: any,
    setLoadingId?: (id: string | null) => void,
    queueList?: any[],
    newQueueIndex?: number,
  ) => {
    if (!ytTrack) return;
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
        coverUrl = ytTrack.thumbnails[0].url || ytTrack.thumbnails[0];
      } else if (ytTrack.image) coverUrl = ytTrack.image;

      if (currentTrackUrl === pipeUrl) {
        togglePlay();
        return;
      }

      const metadata = {
        title: ytTrack.title || "Unknown Title",
        artist: ytTrack.uploaderName || ytTrack.artist || "Unknown Artist",
        coverUrl,
        audioUrl: pipeUrl,
        youtubeId: videoId,
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
        youtubeId: videoId,
        title: metadata.title,
        artist: metadata.artist,
        audioUrl: pipeUrl,
        coverUrl,
        duration: durationStr,
      });

      setActiveMetadata(trackId ? { ...metadata, id: trackId } : metadata);

      if (myRoom) {
        await updateRoomTrack({ roomId: myRoom._id, trackId }).catch(
          console.error,
        );
      }

      failureCountRef.current = 0;
    } catch (error: any) {
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
    if (isAutomatic && isOnLoop) {
      forceSync(undefined, 0, true);
      return;
    }

    if (queue && queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      playTrack(queue[nextIndex], undefined, queue, nextIndex);
      return;
    }

    if (activeMetadata) {
      setIsLoading(true);
      const currentId =
        activeMetadata.youtubeId ||
        activeMetadata.id ||
        activeMetadata.audioUrl?.split("id=")[1];

      try {
        const recommendations = await fetchRelatedTracks(
          currentId,
          queue || [],
        );
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
    if (currentTimeSec > 3) {
      seekToTime(0);
    } else if (queue && queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      playTrack(queue[prevIndex], undefined, queue, prevIndex);
    }
  };

  const playNextPriority = (track: any) => {
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

  const addToQueue = (track: any) => {
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
  };
}
