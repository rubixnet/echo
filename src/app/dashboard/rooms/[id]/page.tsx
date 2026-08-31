"use client";

import Image from "next/image";
import { useCallback, useEffect, use, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import {
  Play,
  Radio,
  Music,
} from "@/components/icons";
import {
  Pause,
  Users,
  Crown,
  Loader2,
  AudioLines,
  LogOut,
  XCircle,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRoomState } from "@/hooks/useRoomContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const roomId = resolvedParams.id as Id<"rooms">;
  const user = useUser();
  const userId = user?._id;

  // Existence check for THIS room - never throws, null means gone.
  const directRoom = useQuery(api.rooms.getRoom, roomId ? { roomId } : "skip");

  // Live membership comes from the global RoomProvider.
  const {
    isInRoom,
    isHost,
    isGuest,
    room,
    roomLoading,
    controlTogglePlay,
    leaveRoom,
    closeRoom,
  } = useRoomState();

  const joinRoomMutation = useMutation(api.rooms.joinRoom);

  const joinThisRoom = useCallback(async () => {
    if (!userId) return;
    try {
      await joinRoomMutation({ roomId, userId });
    } catch {
      /* reactive state reflects reality; errors stay internal */
    }
  }, [joinRoomMutation, roomId, userId]);

  const { currentTimeSec, durationSec } = useAudioEngine();
  const [joiningNow, setJoiningNow] = useState(false);

  /* Direct-link visits auto-join a live session so playback sync kicks
     in immediately - no need to go through the rooms listing first. */
  const joinAttemptedRef = useRef(false);
  useEffect(() => {
    if (directRoom && userId && !isInRoom && !joinAttemptedRef.current) {
      joinAttemptedRef.current = true;
      setJoiningNow(true);
      joinThisRoom().finally(() => setJoiningNow(false));
    }
  }, [directRoom, userId, isInRoom, joinThisRoom]);

  if (directRoom === undefined || roomLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
        <p className="text-sm font-bold text-foreground/60 tracking-tight">
          Tuning into frequency...
        </p>
      </div>
    );
  }

  /* Graceful end-state: the host closed the room or it expired.
     No raw Convex errors ever surface here. */
  if (directRoom === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-3 text-center px-6">
        <XCircle size={36} className="text-foreground/20 mb-1" />
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          This session has ended
        </h2>
        <p className="text-sm text-foreground/50 font-medium max-w-xs leading-relaxed">
          The broadcast you were looking for is no longer live.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/dashboard/rooms")}
        >
          Back to Live Rooms
        </Button>
      </div>
    );
  }

  if (!isInRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
        <p className="text-sm font-medium text-foreground/50 tracking-tight">
          {joiningNow ? "Joining the session..." : "Connecting..."}
        </p>
      </div>
    );
  }

  const progressPercent =
    durationSec && room ? (currentTimeSec / durationSec) * 100 : 0;
  const hasTrack = !!room?.track;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background pt-8 pb-32">
      <div className="flex items-center gap-3 mb-12">
        <div className="px-4 py-1.5 bg-border border-neutral rounded-full flex items-center gap-2 shadow-sm">
          <Radio
            size={14}
            className={cn(
              "text-emerald-500",
              room?.isPlaying && "animate-pulse",
            )}
          />
          <span className="text-xs font-black tracking-widest uppercase text-neutral-500">
            {isHost ? "Broadcasting" : "Live Session"}
          </span>
        </div>

        {!isHost && (
          <div className="px-4 py-1.5 bg-border border-neutral rounded-full flex items-center gap-2 shadow-sm">
            <Crown size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-neutral-500 truncate max-w-[120px]">
              {room?.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-8 relative">
        <button
          onClick={controlTogglePlay}
          disabled={!isHost || !hasTrack}
          className={cn(
            "group relative flex items-center justify-center w-[280px] h-[280px] md:w-[340px] md:h-[340px] rounded-full focus:outline-none transition-transform active:scale-[0.98]",
            isHost && hasTrack ? "cursor-pointer" : "cursor-default",
          )}
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm z-10">
            <circle
              cx="50%"
              cy="50%"
              r="48%"
              stroke="rgba(0,0,0,0.04)"
              strokeWidth="4"
              fill="none"
            />
            {hasTrack && (
              <circle
                cx="50%"
                cy="50%"
                r="48%"
                stroke="#10b981"
                strokeWidth="4"
                fill="none"
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
              <Image width={500} height={500} unoptimized
                src={room!.track!.coverUrl}
                alt="Currently Playing"
                className={cn(
                  "w-full h-full object-cover scale-110 pointer-events-none transition-all duration-[3000ms]",
                  room?.isPlaying ? "animate-[spin_6s_linear_infinite]" : "",
                )}
                style={{
                  animationPlayState: room?.isPlaying ? "running" : "paused",
                }}
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
                {room?.isPlaying ? (
                  <Pause size={18} fill="currentColor" className="text-white" />
                ) : (
                  <Play
                    size={18}
                    fill="currentColor"
                    className="text-white ml-0.5"
                  />
                )}
              </div>
            )}
          </div>
        </button>

        <div className="flex flex-col items-center text-center -mt-2 px-6">
          <h4 className="font-extrabold text-primary text-xl md:text-2xl tracking-tight mb-1 flex items-center gap-2">
            {hasTrack ? room!.track!.title : "Audio Engine Ready"}
            {room?.isPlaying && (
              <AudioLines size={20} className="text-emerald-500" />
            )}
          </h4>
          <p className="text-base text-foreground/70 font-medium tracking-tight">
            {hasTrack
              ? room!.track!.artist
              : isGuest
                ? "Waiting for the host to play something"
                : "Select or search a track to broadcast"}
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-3 text-foreground/50 font-medium tracking-tight">
        <span className="flex items-center gap-2 text-sm">
          <Users size={16} />
          {room?.listeners?.length || 1} tuned in
        </span>

        {isHost ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              closeRoom().then(() => router.push("/dashboard/rooms"))
            }
          >
            <XCircle size={14} /> Close Room
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              leaveRoom().then(() => router.push("/dashboard/rooms"))
            }
          >
            <LogOut size={14} /> Leave
          </Button>
        )}
      </div>
    </div>
  );
}
