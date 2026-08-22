"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";

export default function GlassPlayerDark() {
  const [progress, setProgress] = useState(30);
  const [isPlaying, setIsPlaying] = useState(true);

  const albumPalette = {
    coverUrl:
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop",
    primary: "244, 63, 94", // Coral Red
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-6 font-sans select-none overflow-hidden bg-[#09090b] text-white">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img
          src={albumPalette.coverUrl}
          alt="Base"
          className="absolute w-full h-full object-cover scale-110 opacity-15 filter blur-[90px] grayscale"
        />

        <img
          src={albumPalette.coverUrl}
          alt="Reveal"
          className="absolute w-full h-full object-cover scale-110 transition-all duration-300 ease-out"
          style={{
            clipPath: `circle(${15 + (progress / 100) * 120}% at 50% 50%)`,
            filter: `blur(${Math.max(15, 60 - (progress / 100) * 50)}px)`,
            opacity: 0.2 + (progress / 100) * 0.55,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <header className="text-center pt-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neutral-400 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
            Dark Mode • Obsidian Glass
          </span>
        </header>

        <main className="flex-1 flex items-center justify-center my-6">
          <div className="w-full max-w-[440px] aspect-square flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-30">
              <circle
                cx="50%"
                cy="50%"
                r="48.5%"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="48.5%"
                stroke={`rgb(${albumPalette.primary})`}
                strokeWidth="3"
                fill="none"
                strokeDasharray="305%"
                strokeDashoffset={`${305 - (305 * progress) / 100}%`}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear"
              />
            </svg>

            {/* Obsidian Glass Record Body (No Shadows) */}
            <div
              className={`w-[94%] aspect-square rounded-full relative flex items-center justify-center border-2 border-white/30 backdrop-blur-xl bg-white/[0.04] transition-transform duration-1000 ${
                isPlaying ? "animate-[spin_16s_linear_infinite]" : ""
              }`}
            >
              {/* Glass Specular Glare */}
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_45deg,rgba(255,255,255,0.4)_0deg,transparent_60deg,rgba(255,255,255,0.2)_180deg,transparent_240deg)] pointer-events-none z-30 opacity-70 mix-blend-overlay" />

              {/* Fine Concentric Glass Grooves (No Text) */}
              <div className="absolute inset-5 rounded-full border border-white/15 pointer-events-none" />
              <div className="absolute inset-12 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute inset-20 rounded-full border border-white/10 pointer-events-none" />

              {/* Larger Album Cover (48% size) */}
              <div className="w-[48%] aspect-square rounded-full border-2 border-white/40 relative overflow-hidden bg-neutral-900 z-40">
                <img
                  src={albumPalette.coverUrl}
                  alt="Album Art"
                  className="w-full h-full object-cover"
                />

                {/* Center Spindle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-neutral-200 rounded-full border border-neutral-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* --- CONTROLLER (No Shadows) --- */}
        <footer className="w-full max-w-md mx-auto bg-neutral-900/60 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-base font-extrabold text-white tracking-tight leading-none mb-1">
                We fell in love in october
              </p>
              <p className="text-sm text-neutral-400 font-medium">
                girl in red
              </p>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-11 h-11 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:bg-neutral-200 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: `rgb(${albumPalette.primary})` }}
            />
            <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500">
              <span>
                {Math.floor((progress * 184) / 100 / 60)}:
                {String(Math.floor(((progress * 184) / 100) % 60)).padStart(
                  2,
                  "0",
                )}
              </span>
              <span>3:04</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
