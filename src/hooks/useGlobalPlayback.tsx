import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { useUser } from "@/hooks/useUser"

export function useGlobalPlayback() {
    const user = useUser();
    const { loadTrack, currentTrackUrl, togglePlay, setActiveMetadata, setIsLoading } = useAudioEngine();

    const ensureYoutubeTrack = useMutation(api.tracks.ensureYoutubeTrack)

    const myRoom = useQuery(api.rooms.getMyHosterRooms, user?._id ? { userId: user._id } : "skip");
    const updateRoomTrack = useMutation(api.rooms.updateRoomTract)

    const playTrack = async (ytTrack: any, setLoadingId?: (id: string | null) => void) => {

        const videoId = ytTrack.url?.split("?v=")[1]
            || ytTrack.url?.split("/v/")[1]
            || ytTrack.url?.split("youtu.be/")[1]
            || ytTrack.youtubeId
            || "YQHsXMglC9A";

        setIsLoading(true);
        if (setLoadingId) setLoadingId(videoId);

        try {
            const pipeUrl = `/api/youtube/stream?id=${videoId}`;
            const coverUrl = typeof ytTrack.thumbnails === "string"
                ? ytTrack.thumbnails
                : ytTrack.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256&auto=format&fit=crop";

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

    return { playTrack };
}