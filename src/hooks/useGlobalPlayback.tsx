import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { useUser } from "@/hooks/useUser";

export function useGlobalPlayback() {
    const user = useUser();
    const {
        forceSync, loadTrack, currentTrackUrl, togglePlay, setActiveMetadata,
        setIsLoading, queue, queueIndex, setQueue, setQueueIndex,
        currentTimeSec, seekToTime, isOnLoop
    } = useAudioEngine();

    const ensureYoutubeTrack = useMutation(api.tracks.ensureYoutubeTrack);

    const myRoom = useQuery(api.rooms.getMyHosterRooms, user?._id ? { userId: user._id } : "skip");
    const updateRoomTrack = useMutation(api.rooms.updateRoomTrack);

    const playTrack = async (ytTrack: any, setLoadingId?: (id: string | null) => void, queueList?: any[], newQueueIndex?: number) => {

        const videoId = ytTrack.youtubeId
            || ytTrack.audioUrl?.split("id=")[1]
            || ytTrack.url?.split("?v=")[1]
            || ytTrack.url?.split("/v/")[1]
            || ytTrack.url?.split("youtu.be/")[1]
            || "YQHsXMglC9A";

        setIsLoading(true);
        if (setLoadingId) setLoadingId(videoId);

        if (queueList && newQueueIndex !== undefined) {
            setQueue(queueList);
            setQueueIndex(newQueueIndex);
        } else if (!queueList) {
            setQueue([ytTrack]);
            setQueueIndex(0);
        }

        try {
            const pipeUrl = `/api/youtube/stream?id=${videoId}`;

            let coverUrl = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop";

            if (ytTrack.thumbnail) {
                coverUrl = ytTrack.thumbnail;
            } else if (ytTrack.coverUrl) {
                coverUrl = ytTrack.coverUrl;
            } else if (typeof ytTrack.thumbnails === "string") {
                coverUrl = ytTrack.thumbnails;
            } else if (Array.isArray(ytTrack.thumbnails) && ytTrack.thumbnails.length > 0) {
                coverUrl = ytTrack.thumbnails[0].url || ytTrack.thumbnails[0];
            } else if (ytTrack.image) {
                coverUrl = ytTrack.image;
            }

            if (currentTrackUrl === pipeUrl) {
                togglePlay();
                return;
            }

            const metadata = {
                title: ytTrack.title,
                artist: ytTrack.uploaderName || ytTrack.artist || "Unknown Artist",
                coverUrl,
                audioUrl: pipeUrl,
            };

            loadTrack(pipeUrl, metadata);

            const durationStr = typeof ytTrack.duration === "number"
                ? `${Math.floor(ytTrack.duration / 60)}:${Math.floor(ytTrack.duration % 60).toString().padStart(2, '0')}`
                : (ytTrack.duration || "0:00");


            const trackId = await ensureYoutubeTrack({
                youtubeId: videoId,
                title: ytTrack.title,
                artist: ytTrack.uploaderName || ytTrack.artist || "Unknown Artist",
                audioUrl: pipeUrl,
                coverUrl,
                duration: durationStr
            });

            setActiveMetadata(trackId ? { ...metadata, id: trackId } : metadata);
            if (myRoom) {
                await updateRoomTrack({ roomId: myRoom._id, trackId: trackId }).catch(console.error);
            }

        } catch (error: any) {
            console.error("Playback failed:", error);
        } finally {
            setIsLoading(false);
            if (setLoadingId) setLoadingId(null);
        }
    };

    const playNext = (isAutomatic: boolean = false) => {
        if (isAutomatic && isOnLoop) {
            forceSync(undefined, 0, true);
            return;
        }
        if (queue && queueIndex < queue.length - 1) {
            const nextIndex = queueIndex + 1;
            playTrack(queue[nextIndex], undefined, queue, nextIndex);
        }
    };

    const playNextPriority = (track: any) => {
        if (!queue || queue.length === 0) {
            playTrack(track);
            return;
        }
        const newQueue = [...queue];
        newQueue.splice(queueIndex + 1, 0, track);
        setQueue(newQueue);
    };

    const playPrevious = () => {
        if (currentTimeSec > 3) {
            seekToTime(0);
            return;
        } else {
            if (queue && queueIndex > 0) {
                const prevIndex = queueIndex - 1;
                playTrack(queue[prevIndex], undefined, queue, prevIndex);
            }
        }
    };

    const addToQueue = (track: any) => {
        if (!queue || queue.length === 0) {
            playTrack(track);
            return;
        }
        setQueue([...queue, track]);
    };

    return { playTrack, playPrevious, playNext, playNextPriority, addToQueue };
}