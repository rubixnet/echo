"use client";

import { useEffect, use } from "react"; 
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/hooks/audioPlayer";
import { Play, Pause } from "lucide-react";

export default function RoomPage({ params, user }: { params: Promise<{ id: string }>; user?: any }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id as any;

  const room = useQuery(api.rooms.getRoom, { roomId });
  const syncPlayback = useMutation(api.rooms.syncPlayback);
  const { forceSync, loadTrack, getCurrentTime, currentTrackUrl } = useAudioEngine();

  useEffect(() => {
    if (!room || !room.track) return;

    if (currentTrackUrl !== room.track.audioUrl) {
      loadTrack(room.track.audioUrl);
    }

    forceSync(room.serverStartTime, room.pausePosition, room.isPlaying);
    
  }, [room, forceSync, loadTrack, currentTrackUrl]);

  if (!room) return <div className="p-12 text-center text-neutral-500 font-bold">Connecting to Jam Session...</div>;

  const handleHostToggle = async () => {
    // SECURITY: Ensure we have a valid user ID to send
    if (!user || !user._id) {
        console.error("Missing User ID. Cannot sync playback.");
        return;
    }

    const willPlay = !room.isPlaying; 
    
    await syncPlayback({
      roomId: room._id,
      isPlaying: willPlay,
      clientCurrentTime: getCurrentTime(),
      userId: user._id 
    });
  };

  return (
    <div className="p-12 flex flex-col items-center justify-center h-full">
      <div className="w-64 h-64 bg-neutral-200 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-neutral-200/50">
         <img src={room.track?.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200"} alt="Cover" className="w-full h-full object-cover" />
      </div>
      <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{room.track?.title || "Live Audio Stream"}</h2>
      
      <button 
        onClick={handleHostToggle}
        className="mt-8 px-8 py-4 bg-emerald-500 text-white font-bold rounded-full flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
      >
        {room.isPlaying ? <Pause size={20} /> : <Play size={20} />}
        {room.isPlaying ? "Pause Room" : "Start Jam"}
      </button>

      <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full border border-neutral-200/60">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
          {room.listeners.length} Listeners Synced
        </p>
      </div>
    </div>
  );
}