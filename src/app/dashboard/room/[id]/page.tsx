"use client";

import { useEffect, use } from "react"; 
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { Play, Pause } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id as any;
  const user = useUser(); 
  const room = useQuery(api.rooms.getRoom, { roomId });
  const syncPlayback = useMutation(api.rooms.syncPlayback);
  
  const { forceSync, loadTrack, getCurrentTime, currentTrackUrl } = useAudioEngine();

  useEffect(() => {
    if (!room) return;
    const trackUrlToPlay = room.track?.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    if (currentTrackUrl !== trackUrlToPlay) {
      loadTrack(trackUrlToPlay);
    }
    forceSync(room.serverStartTime, room.pausePosition, room.isPlaying);
  }, [room, forceSync, loadTrack, currentTrackUrl]);

  if (!room) return <div className="p-12 text-center text-neutral-400 font-bold">Connecting to Jam Session...</div>;

  const handleHostToggle = async () => {
    if (!user?._id) {
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
    <div className="p-12 flex flex-col items-center justify-center h-full text-neutral-900">
      <div className="w-64 h-64 bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xl mb-8">
         <img src={room.track?.coverUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200"} alt="Cover" className="w-full h-full object-cover" />
      </div>
      <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{room.track?.title || "Live Audio Stream"}</h2>
      <p className="text-sm font-medium text-neutral-500 mt-1">{room.track?.artist || "Global Vault Source"}</p>
      
      <button 
        onClick={handleHostToggle}
        className="mt-8 px-8 py-4 bg-neutral-900 text-white font-bold rounded-full flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-md active:scale-95"
      >
        {room.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        {room.isPlaying ? "Pause Room" : "Start Jam"}
      </button>

      <div className="mt-6 flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-full shadow-sm">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
          {room.listeners?.length || 1} Listeners Synced
        </p>
      </div>
    </div>
  );
} 