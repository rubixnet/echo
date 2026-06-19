"use client";

import { useEffect, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, Radio, Users, Crown, Loader2, AudioLines, Music } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { getPerfectSyncTime } from "@/lib/delay";

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id as any;
  const user = useUser();

  const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : "skip");
  const syncPlayback = useMutation(api.rooms.syncPlayback);

  const {
    loadTrack,
    currentTimeSec,
    durationSec,
    isPlaying: localIsPlaying,
    togglePlay,
    seekToTime,
    currentTrackUrl,
    isAudioReady
  } = useAudioEngine();

  const isHost = user?._id === room?.hostId;

  useEffect(() => {
    if (!room || !room.track?.audioUrl) return;

    const trackUrlToPlay = room.track.audioUrl;

    if (currentTrackUrl !== trackUrlToPlay) {
      loadTrack(trackUrlToPlay, {
        title: room.track.title,
        artist: room.track.artist,
        coverUrl: room.track.coverUrl,
      });
      return;
    }

    if (!isAudioReady) return;

    const perfectTime = getPerfectSyncTime(room.serverStartTime, room.pausePosition, room.isPlaying, 0);

    if (Math.abs(currentTimeSec - perfectTime) > 0.5) {
      seekToTime(perfectTime);
    }

    if (room.isPlaying && !localIsPlaying) {
      togglePlay();
    } else if (!room.isPlaying && localIsPlaying) {
      togglePlay();
    }

  }, [room?.serverStartTime, room?.pausePosition, room?.isPlaying, room?.track?.audioUrl, currentTrackUrl, isAudioReady]);

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
        <p className="text-neutral-400 font-bold tracking-tight">Tuning into frequency...</p>
      </div>
    );
  }

  const handleHostToggle = async () => {
    if (!isHost || !user?._id || !room.track) return;

    const willPlay = !room.isPlaying;
    await syncPlayback({
      roomId: room._id,
      isPlaying: willPlay,
      clientCurrentTime: currentTimeSec,
      userId: user._id
    });
  };

  const progressPercent = durationSec ? (currentTimeSec / durationSec) * 100 : 0;
  const hasTrack = !!room.track;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#FAFAFA] text-neutral-900 pt-8 pb-32">

      <div className="flex items-center gap-3 mb-12">
        <div className="px-4 py-1.5 bg-white border border-neutral-200/80 rounded-full flex items-center gap-2 shadow-sm">
          <Radio size={14} className={cn("text-emerald-500", room.isPlaying && "animate-pulse")} />
          <span className="text-xs font-black tracking-widest uppercase text-neutral-500">
            {isHost ? "You are  Broadcasting" : "Live Session"}
          </span>
        </div>

        {!isHost && (
          <div className="px-4 py-1.5 bg-white border border-neutral-200/80 rounded-full flex items-center gap-2 shadow-sm">
            <Crown size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-neutral-500 truncate max-w-[120px]">
              {room.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-8 relative">
        <button
          onClick={handleHostToggle}
          disabled={!isHost || !hasTrack}
          className={cn(
            "group relative flex items-center justify-center w-[280px] h-[280px] md:w-[340px] md:h-[340px] rounded-full focus:outline-none transition-transform active:scale-[0.98]",
            (isHost && hasTrack) ? "cursor-pointer" : "cursor-default"
          )}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm z-10">
            <circle
              cx="50%" cy="50%" r="48%"
              stroke="rgba(0,0,0,0.04)" strokeWidth="4" fill="none"
            />
            {hasTrack && (
              <circle
                cx="50%" cy="50%" r="48%"
                stroke="#10b981"
                strokeWidth="4" fill="none"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 - progressPercent}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear"
              />
            )}
          </svg>

          <div className="w-[260px] h-[260px] md:w-[320px] md:h-[320px] rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden relative bg-neutral-100 border border-neutral-200/50">
            {hasTrack ? (
              <img
                src={room.track.coverUrl}
                alt="Currently Playing"
                className={cn(
                  "w-full h-full object-cover scale-110 pointer-events-none transition-all duration-[3000ms]",
                  room.isPlaying ? "animate-[spin_6s_linear_infinite]" : ""
                )}
                style={{ animationPlayState: room.isPlaying ? 'running' : 'paused' }}
              />
            ) : (
              <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                <Music size={48} className="text-neutral-300" />
              </div>
            )}

            <div className="absolute inset-0 rounded-full border-[20px] border-black/5 mix-blend-overlay pointer-events-none" />
            <div className="absolute inset-0 rounded-full border-[1px] border-white/20 inset-ring pointer-events-none" />
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#fcfcfc] rounded-full shadow-inner flex items-center justify-center border border-neutral-200 z-20 overflow-hidden">
            <div className="w-2 h-2 bg-neutral-300 rounded-full shadow-sm group-hover:opacity-0 transition-opacity duration-200" />

            {isHost && hasTrack && (
              <div className="absolute inset-0 bg-neutral-900 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                {room.isPlaying ? (
                  <Pause size={18} fill="currentColor" className="text-white" />
                ) : (
                  <Play size={18} fill="currentColor" className="text-white ml-0.5" />
                )}
              </div>
            )}
          </div>
        </button>

        <div className="flex flex-col items-center text-center -mt-2 px-6">
          <h4 className="font-extrabold text-neutral-900 text-xl md:text-2xl tracking-tight mb-1 flex items-center gap-2">
            {hasTrack ? room.track.title : "Audio Engine Ready"}
            {room.isPlaying && <AudioLines size={20} className="text-emerald-500" />}
          </h4>
          <p className="text-base text-neutral-500 font-medium">
            {hasTrack ? room.track.artist : "Select or search a track to broadcast"}
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-2 text-neutral-400 font-medium">
        <Users size={16} />
        <span>{room.listeners?.length || 1} tuned into this frequency</span>
      </div>
    </div>
  );
}