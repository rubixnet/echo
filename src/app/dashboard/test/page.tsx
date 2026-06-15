"use client";

import { useState, useRef } from "react";
import { Play, Pause, Music } from "lucide-react";

export default function AudioSanityTestPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const testMp3Url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

  const handleTogglePlay = () => {
    try {
      setError(null);
      
      if (!audioRef.current) {
        audioRef.current = new Audio(testMp3Url);
        
        audioRef.current.onerror = (e) => {
          console.error("Native Audio Error Object:", e);
          setError("The browser failed to load the audio source.");
          setIsPlaying(false);
        };
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Playback execution failed:", err);
            setError(`Autoplay blocked or failed: ${err.message}`);
          });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAFAFA] p-6">
      <div className="w-full max-w-md bg-white border border-neutral-200 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6 text-center">
        <div className="w-16 h-16 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Music className={isPlaying ? "text-emerald-500 animate-pulse" : "text-neutral-400"} size={24} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-neutral-950">Audio Engine Sandbox</h1>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Testing a direct, unproxied audio stream. This completely bypasses Convex, layouts, and extraction logic.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-medium text-left">
            {error}
          </div>
        )}

        <button
          onClick={handleTogglePlay}
          className="w-full h-12 bg-neutral-950 hover:bg-neutral-900 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          {isPlaying ? "Pause Stream" : "Stream Test Song"}
        </button>

        <div className="pt-2 text-[10px] font-mono text-neutral-400 truncate">
          URL: {testMp3Url}
        </div>
      </div>
    </div>
  );
}