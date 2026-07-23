"use client";

import { useEffect, use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause, Radio, Users, Crown, Loader2, AudioLines, Music, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getPerfectSyncTime } from "@/lib/delay";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";

export default function RoomIdPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id as any;
  const user = useUser();

  const room = useQuery(api.rooms.getRoom, roomId ? { roomId } : "skip");
  const syncPlayback = useMutation(api.rooms.syncPlayback);
  const keepAlive = useMutation(api.rooms.keepRoomAlive);

  const [showIdlePopup, setShowIdlePopup] = useState(false);

  const {
    loadTrack,
    currentTimeSec,
    durationSec,
    isPlaying: localIsPlaying,
    togglePlay,
    seekToTime,
    currentTrackUrl,
    isAudioReady,
    pause 
  } = useAudioEngine();

  const isHost = user?._id === room?.hostId;

  useEffect(() => {
    if (!roomId) return;
    keepAlive({ roomId }).catch(() => {});
    const interval = setInterval(() => {
        keepAlive({ roomId }).catch(() => {});
    }, 15000); 
    return () => clearInterval(interval);
  }, [roomId, keepAlive]);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetIdleTimer = () => {
      if (showIdlePopup) return;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setShowIdlePopup(true), 3600000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('click', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
    };
  }, [showIdlePopup]);

  
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)] w-full bg-background text-foreground">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-foreground/50 font-bold tracking-tight">Tuning into frequency...</p>
      </div>
    );
  }

  const handleHostToggle = async () => {
    if (!isHost || !user?._id || !room.track) return;
    await syncPlayback({
      roomId: room._id,
      isPlaying: !room.isPlaying,
      clientCurrentTime: currentTimeSec,
      userId: user._id
    });
  };

  const handleLeaveRoom = () => {
    if (localIsPlaying) pause(); 
    router.push('/dashboard'); 
  };

  const progressPercent = durationSec ? (currentTimeSec / durationSec) * 100 : 0;
  const hasTrack = !!room.track;

  return (
    <div className="relative flex flex-col items-center min-h-[calc(100vh-6rem)] w-full bg-background text-foreground pt-8 pb-32 overflow-hidden">
        
      {hasTrack && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 opacity-20">
          <img src={room.track!.coverUrl} className="w-full h-full object-cover blur-[100px] saturate-150" alt="" />
          <div className="absolute inset-0 bg-background/80" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-4xl px-6 flex items-center justify-between mb-16">
        <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 bg-foreground/5 border border-foreground/10 backdrop-blur-md rounded-full flex items-center gap-2 shadow-sm">
            <Radio size={14} className={cn("text-emerald-500", room.isPlaying && "animate-pulse")} />
            <span className="text-xs font-black tracking-widest uppercase text-foreground/70">
                {isHost ? "You are Broadcasting" : "Live Session"}
            </span>
            </div>

            {!isHost && (
            <div className="px-4 py-1.5 bg-foreground/5 border border-foreground/10 backdrop-blur-md rounded-full flex items-center gap-2 shadow-sm">
                <Crown size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-foreground/70 truncate max-w-[120px]">
                {room.name}
                </span>
            </div>
            )}
        </div>

        <LiquidContainer radius="12px">
            <button
                onClick={handleLeaveRoom}
                className="flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-rose-500 hover:text-white text-foreground/70 text-xs font-bold transition-colors"
            >
                <LogOut size={14} />
                Leave Room
            </button>
        </LiquidContainer>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-10 mt-4">
        
        {isHost ? (

            <button
                onClick={handleHostToggle}
                disabled={!hasTrack}
                className="group relative flex items-center justify-center w-[260px] h-[260px] md:w-[300px] md:h-[300px] rounded-full focus:outline-none transition-transform active:scale-95"
            >
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10">
                    <circle cx="50%" cy="50%" r="48%" stroke="var(--foreground)" strokeOpacity="0.1" strokeWidth="3" fill="none" />
                    {hasTrack && (
                        <circle
                            cx="50%" cy="50%" r="48%"
                            stroke="var(--primary, #10b981)"
                            strokeWidth="3" fill="none"
                            pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progressPercent}
                            strokeLinecap="round"
                            className="transition-all duration-300 ease-linear"
                        />
                    )}
                </svg>

                <div className="absolute inset-[16px] rounded-full overflow-hidden bg-background shadow-2xl border border-foreground/10">
                    {hasTrack ? (
                        <img
                            src={room.track!.coverUrl}
                            alt="Playing"
                            className={cn(
                                "w-full h-full object-cover scale-105",
                                room.isPlaying ? "animate-[spin_6s_linear_infinite]" : ""
                            )}
                            style={{ animationPlayState: room.isPlaying ? 'running' : 'paused' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                            <Music size={32} className="text-foreground/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-background/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-foreground/10 z-30 transition-transform duration-300 group-hover:scale-110">
                    {hasTrack ? (
                        <div className="text-foreground flex items-center justify-center">
                            {room.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                        </div>
                    ) : (
                        <div className="w-3 h-3 bg-foreground/20 rounded-full" />
                    )}
                </div>
            </button>
        ) : (

            <div className="relative flex items-center justify-center w-[260px] h-[260px] md:w-[300px] md:h-[300px]">
                <div className="absolute inset-0 rounded-full bg-foreground/[0.02] border border-foreground/10 shadow-2xl" />
                <div className="absolute inset-[12px] rounded-full overflow-hidden bg-background shadow-inner">
                    {hasTrack ? (
                        <img
                            src={room.track!.coverUrl}
                            alt="Playing"
                            className={cn(
                                "w-full h-full object-cover",
                                room.isPlaying ? "animate-[spin_6s_linear_infinite]" : ""
                            )}
                            style={{ animationPlayState: room.isPlaying ? 'running' : 'paused' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                            <Music size={32} className="text-foreground/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,0.6)] pointer-events-none" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-background rounded-full flex items-center justify-center border border-foreground/10 shadow-lg z-30">
                    <div className="w-3 h-3 bg-foreground/20 rounded-full inset-shadow-sm" />
                </div>
            </div>
        )}

        <div className="flex flex-col items-center text-center px-6">
          <h4 className="font-extrabold text-foreground text-xl md:text-2xl tracking-tight mb-1 flex items-center gap-2">
            {hasTrack ? room.track!.title : "Waiting for Host"}
            {room.isPlaying && <AudioLines size={20} className="text-primary" />}
          </h4>
          <p className="text-base text-foreground/50 font-medium">
            {hasTrack ? room.track!.artist : "The broadcast will begin shortly"}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-12 flex items-center gap-2 text-foreground/40 font-medium">
        <Users size={16} />
        <span>{room.listeners?.length || 1} tuned into this frequency</span>
      </div>
    </div>
  );
}