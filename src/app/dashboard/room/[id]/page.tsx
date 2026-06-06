"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAudio } from "@/components/AudioProvider";
import { Play, Pause } from "lucide-react";

export default function RoomPage({ params }: { params: { id: string } }) {
  const room = useQuery(api.rooms.getRoom, { roomId: params.id as any });
  const syncPlayback = useMutation(api.rooms.syncPlayback);
  const { forceSync, loadTrack, getCurrentTime, currentTrackUrl } = useAudio();

  useEffect(() => {
    if (!room || !room.track) return;

    if (currentTrackUrl !== room.track.audioUrl) {
      loadTrack(room.track.audioUrl);
    }

    forceSync(room.serverStartTime, room.pausePosition, room.isPlaying);
    
  }, [room, forceSync, loadTrack, currentTrackUrl]);

  if (!room) return <div>Loading room...</div>;

  const handleHostToggle = async () => {
    const willPlay = !room.isPlaying; 
    
    await syncPlayback({
      roomId: room._id,
      isPlaying: willPlay,
      clientCurrentTime: getCurrentTime(),
    });
  };

  return (
    <div className="p-12 flex flex-col items-center justify-center h-full">
      <div className="w-64 h-64 bg-neutral-200 rounded-2xl overflow-hidden shadow-2xl mb-8">
         <img src={room.track?.coverUrl} alt="Cover" className="w-full h-full object-cover" />
      </div>
      <h2 className="text-3xl font-black text-neutral-900 tracking-tight">{room.track?.title}</h2>
      
      <button 
        onClick={handleHostToggle}
        className="mt-8 px-8 py-4 bg-emerald-500 text-white font-bold rounded-full flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg"
      >
        {room.isPlaying ? <Pause size={20} /> : <Play size={20} />}
        {room.isPlaying ? "Pause Room" : "Start Jam"}
      </button>

      <p className="mt-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
        {room.listeners.length} Listeners Synced
      </p>
    </div>
  );
}