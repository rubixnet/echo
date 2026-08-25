"use client";

import React, { useState, useRef, ReactNode } from "react";
import {
  LiquidBackground,
  type GlassPreset,
} from "@/components/LiquidBackground";

function Draggable({
  children,
  initialX,
  initialY,
  label,
}: {
  children: ReactNode;
  initialX: number;
  initialY: number;
  label: string;
}) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y,
    });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={`absolute select-none ${
        isDragging ? "cursor-grabbing z-50" : "cursor-grab z-20"
      }`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={isDragging ? "pointer-events-none" : ""}>
        <span className="absolute -top-5 left-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 pl-1 whitespace-nowrap pointer-events-none">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

function GlassContextMenu({
  items,
  preset = "frosted",
}: {
  items: { label: string; action: () => void }[];
  preset?: GlassPreset;
}) {
  return (
    <div className="relative w-64 p-2 shadow-2xl flex flex-col gap-1 rounded-[16px]">
      <LiquidBackground preset={preset} config={{ radius: 16 }} />
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          className="relative z-10 w-full text-left px-4 py-2.5 text-sm text-zinc-100 hover:text-white hover:bg-white/15 rounded-lg transition-colors font-medium active:scale-[0.98]"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function GlassLens({
  preset = "frosted",
  width = 200,
  height = 140,
  children,
}: {
  preset?: GlassPreset;
  width?: number;
  height?: number;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative rounded-[16px] shadow-2xl overflow-hidden"
      style={{ width, height }}
    >
      <LiquidBackground preset={preset} config={{ radius: 16 }} />
      {children && (
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export default function LiquidGlassTestPage() {
  const [bgType, setBgType] = useState<"gradient" | "image" | "dark">(
    "gradient"
  );

  const UNSPLASH_IMG =
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop";

  const GRADIENT_MESH = `
    radial-gradient(at 10% 20%, rgba(236, 72, 153, 0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(59, 130, 246, 0.8) 0px, transparent 50%),
    radial-gradient(at 50% 80%, rgba(168, 85, 247, 0.8) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(16, 185, 129, 0.8) 0px, transparent 50%),
    #09090b
  `;
  const SOLID_DARK = "#09090b";

  const activeCssBg =
    bgType === "image"
      ? `url('${UNSPLASH_IMG}')`
      : bgType === "gradient"
        ? GRADIENT_MESH
        : SOLID_DARK;

  return (
    <main
      className="min-h-screen relative overflow-hidden text-white"
      style={{
        background: activeCssBg,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-white/10 p-2 rounded-xl flex gap-2 backdrop-blur-md">
        {(
          [
            ["gradient", "Gradient Mesh"],
            ["image", "Unsplash Photo"],
            ["dark", "Plain Dark"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setBgType(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              bgType === key
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center text-xs text-zinc-300 bg-black/60 px-4 py-2 rounded-full border border-white/10 pointer-events-none z-10">
        Drag glass elements over any card / text / button. Real DOM content is
        frosted + edge-refracted — no image required.
      </div>

      <Draggable initialX={40} initialY={130} label="Frosted Menu">
        <GlassContextMenu
          preset="frosted"
          items={[
            { label: "Badminton Matches", action: () => {} },
            { label: "Player Analytics", action: () => {} },
            { label: "Sync Status", action: () => {} },
            { label: "Logout DK", action: () => {} },
          ]}
        />
      </Draggable>

      <Draggable initialX={340} initialY={130} label="Frosted Navbar">
        <div className="relative w-80 p-3 flex items-center justify-between rounded-[16px]">
          <LiquidBackground preset="frosted" config={{ radius: 16 }} />
          <span className="relative z-10 text-xs font-bold text-white px-2 py-1">
            Home
          </span>
          <span className="relative z-10 text-xs font-bold text-zinc-300 px-2 py-1">
            Search
          </span>
          <span className="relative z-10 text-xs font-bold text-zinc-300 px-2 py-1">
            Library
          </span>
          <span className="relative z-10 text-xs font-bold text-zinc-300 px-2 py-1">
            Settings
          </span>
        </div>
      </Draggable>

      <Draggable initialX={660} initialY={130} label="Simple Lens">
        <GlassLens preset="simple" width={180} height={120}>
          <span className="text-white/70 text-xs font-medium">
            Drag me around
          </span>
        </GlassLens>
      </Draggable>

      <div className="absolute top-72 left-12 right-12 grid grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/80 to-purple-600/80 border border-pink-500/50 space-y-2 shadow-xl">
          <h2 className="text-xl font-bold text-white">Vibrant Pink Card</h2>
          <p className="text-xs text-pink-100 leading-relaxed">
            Drag any glass element over this card. You will see the pink
            background AND the white text both blur and optically bend at the
            glass edges — pure DOM sampling, zero image dependency.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-800 border border-white/20 space-y-2 shadow-xl">
          <h2 className="text-xl font-bold text-emerald-400">
            High-Contrast Text
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            1234567890 !@#$%^&*()
          </p>
          <button className="mt-2 text-xs bg-emerald-500 text-black px-3 py-1.5 rounded-lg font-bold">
            Interactive HTML Button
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/80 to-indigo-700/80 border border-blue-400/50 space-y-2 shadow-xl">
          <h2 className="text-xl font-bold text-white">Geometric Accent Card</h2>
          <div className="flex gap-2 pt-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 shadow-lg" />
            <div className="w-8 h-8 rounded-full bg-rose-500 shadow-lg" />
            <div className="w-8 h-8 rounded-full bg-cyan-400 shadow-lg" />
          </div>
        </div>
      </div>

      <div className="absolute top-[520px] left-12 right-12 grid grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500" />
            <div>
              <p className="text-sm font-bold text-white">Album Art Card</p>
              <p className="text-[11px] text-zinc-400">Artist Name</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full"
                style={{
                  background: `hsl(${i * 60}, 70%, 60%)`,
                  opacity: 0.6 + i * 0.08,
                }}
              />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-900/50 border border-emerald-500/30 space-y-2">
          <h3 className="text-sm font-bold text-emerald-300">
            Success Indicator
          </h3>
          <p className="text-[11px] text-emerald-200/70">
            All systems operational. Latency: 12ms. Uptime: 99.98%.
          </p>
          <div className="flex gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-1.5 h-3 rounded-full bg-emerald-400"
                style={{ opacity: 0.3 + i * 0.14 }}
              />
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-600/60 to-orange-500/60 border border-rose-400/30 space-y-2">
          <h3 className="text-sm font-bold text-white">Warm Gradient Card</h3>
          <p className="text-[11px] text-rose-100/80">
            This card uses a warm gradient. Glass should show warm tones
            bleeding through the frost.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-700 space-y-2">
          <h3 className="text-sm font-bold text-zinc-100">Dark Minimal Card</h3>
          <div className="space-y-1.5">
            <div className="h-2 w-full rounded-full bg-zinc-700" />
            <div className="h-2 w-3/4 rounded-full bg-zinc-700" />
            <div className="h-2 w-1/2 rounded-full bg-zinc-700" />
          </div>
          <p className="text-[11px] text-zinc-500 pt-1">
            Skeleton loading pattern
          </p>
        </div>
      </div>

      <div className="absolute top-[680px] left-12 right-12 grid grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-500/40 space-y-3">
          <h3 className="text-lg font-bold text-zinc-200">
            Plain HTML Content
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This is just regular HTML with no special background. The glass
            should still refract and frost the text when dragged over it.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
              Tag 1
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
              Tag 2
            </span>
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
              Tag 3
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-500/20 space-y-3">
          <h3 className="text-lg font-bold text-cyan-300">
            Horizontal Gradient Bar
          </h3>
          <div className="h-24 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 shadow-lg" />
          <p className="text-xs text-cyan-200/60">
            A vivid gradient bar that should distort beautifully under the
            glass lens.
          </p>
        </div>
      </div>
    </main>
  );
}
