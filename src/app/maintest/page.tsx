"use client";

import React, { useState, useRef } from "react";
import { Home, Search, Library, Radio, Settings, Bell, Move, Sliders, RefreshCw } from "lucide-react";
import { LiquidGlass } from "@/components/LiquidGlass"; 

function useDraggable(initialX: number, initialY: number) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  return { pos, bind: { onPointerDown, onPointerMove, onPointerUp } };
}


const NEW_BG = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2560&auto=format&fit=crop";

export default function GlassSandboxPage() {
  const [params, setParams] = useState({
    depth: 80,
    splay: 12,
    feather: 20,
    curve: 2.2,
    blur: 2,
    chroma: 0.05,
    glint: 30,
    tint: 0,
    tintColor: "#ffffff",
  });

  const updateParam = (key: string, value: number | string) => {
    setParams(p => ({ ...p, [key]: value }));
  };

  const navDrag = useDraggable(window.innerWidth / 2 - 250, 30);
  const cardDrag = useDraggable(100, 160);
  const buttonDrag = useDraggable(window.innerWidth - 180, 160);
  const presetDrag = useDraggable(100, 480);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-zinc-950 font-sans select-none">
      
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${NEW_BG})` }}
      />

      <div 
        style={{ transform: `translate3d(${navDrag.pos.x}px, ${navDrag.pos.y}px, 0)` }}
        className="absolute z-30 cursor-grab active:cursor-grabbing"
        {...navDrag.bind}
      >
        <div className="flex items-center gap-3">
          
          <LiquidGlass
            radius={50}
            bgImage={NEW_BG}
            customParams={params}
            className="w-[420px] h-12 px-2 shadow-2xl border border-white/20"
          >
            <div className="w-full h-full flex items-center justify-between px-2 text-white">
              <Home size={18} className="hover:text-blue-400 transition-colors cursor-pointer" />
              <Search size={18} className="hover:text-blue-400 transition-colors cursor-pointer" />
              <Library size={18} className="hover:text-blue-400 transition-colors cursor-pointer" />
              <Radio size={18} className="hover:text-blue-400 transition-colors cursor-pointer" />
              <Settings size={18} className="hover:text-blue-400 transition-colors cursor-pointer" />
            </div>
          </LiquidGlass>

          <LiquidGlass
            radius={24}
            bgImage={NEW_BG}
            customParams={params}
            className="w-12 h-12 shadow-xl border border-white/20 flex items-center justify-center text-white"
          >
            <Bell size={20} />
          </LiquidGlass>
        </div>
      </div>

      <div 
        style={{ transform: `translate3d(${cardDrag.pos.x}px, ${cardDrag.pos.y}px, 0)` }}
        className="absolute z-20 cursor-grab active:cursor-grabbing w-[420px]"
        {...cardDrag.bind}
      >
        <LiquidGlass
          radius={32}
          bgImage={NEW_BG}
          customParams={params}
          className="p-8 shadow-2xl border border-white/25 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight">Interactive Glass</h2>
            <Move size={16} className="text-white/60" />
          </div>
          <p className="text-sm text-white/80 leading-relaxed mb-6">
            Click and drag this card, the navbar, or any element around the screen. Watch how the optical refraction warps the background dynamically in real time!
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-md transition-all">
              Explore More
            </button>
          </div>
        </LiquidGlass>
      </div>

      <div 
        style={{ transform: `translate3d(${buttonDrag.pos.x}px, ${buttonDrag.pos.y}px, 0)` }}
        className="absolute z-20 cursor-grab active:cursor-grabbing"
        {...buttonDrag.bind}
      >
        <LiquidGlass
          radius={16}
          bgImage={NEW_BG}
          customParams={params}
          className="px-6 py-4 shadow-xl border border-white/20 text-white flex items-center gap-3 font-semibold"
        >
          <Sliders size={18} />
          <span>Draggable Action</span>
        </LiquidGlass>
      </div>

      <div 
        style={{ transform: `translate3d(${presetDrag.pos.x}px, ${presetDrag.pos.y}px, 0)` }}
        className="absolute z-20 cursor-grab active:cursor-grabbing w-[340px]"
        {...presetDrag.bind}
      >
        <LiquidGlass
          radius={24}
          bgImage={NEW_BG}
          customParams={params}
          className="p-6 shadow-2xl border border-white/20 text-white"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 text-white/70">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Soft", val: { depth: 60, splay: 2, feather: 24, curve: 2, blur: 0, chroma: 0, glint: 25, tint: 0, tintColor: "#ffffff" } },
              { name: "Thick", val: { depth: 120, splay: 2, feather: 30, curve: 3, blur: 0, chroma: 0.05, glint: 60, tint: 0, tintColor: "#ffffff" } },
              { name: "Frosted", val: { depth: 120, splay: 16, feather: 26, curve: 2.6, blur: 5, chroma: 0, glint: 20, tint: 0, tintColor: "#ffffff" } },
              { name: "Plexi", val: { depth: 60, splay: 4, feather: 10, curve: 1.2, blur: 2.5, chroma: 0, glint: 25, tint: 0.94, tintColor: "#ff6600" } },
            ].map(p => (
              <button 
                key={p.name}
                onClick={(e) => { e.stopPropagation(); setParams(p.val); }}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors border border-white/10 text-center"
              >
                {p.name}
              </button>
            ))}
          </div>
        </LiquidGlass>
      </div>

      <div className="fixed bottom-6 right-6 z-50 w-[300px] p-5 bg-[#1c1c1e]/95 backdrop-blur-xl rounded-2xl text-zinc-200 text-xs shadow-2xl border border-zinc-800 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <span className="font-bold uppercase tracking-wider text-zinc-400">Live Lens Controls</span>
          <button onClick={() => setParams({ depth: 80, splay: 12, feather: 20, curve: 2.2, blur: 2, chroma: 0.05, glint: 30, tint: 0, tintColor: "#ffffff" })} className="hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Depth <input type="range" min="0" max="120" step="1" value={params.depth} onChange={e => updateParam("depth", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.depth}</span>
        </label>
        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Splay <input type="range" min="2" max="40" step="1" value={params.splay} onChange={e => updateParam("splay", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.splay}</span>
        </label>
        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Feather <input type="range" min="0" max="40" step="1" value={params.feather} onChange={e => updateParam("feather", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.feather}</span>
        </label>
        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Curve <input type="range" min="0.3" max="3" step="0.1" value={params.curve} onChange={e => updateParam("curve", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.curve}</span>
        </label>
        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Blur <input type="range" min="0" max="10" step="0.5" value={params.blur} onChange={e => updateParam("blur", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.blur}</span>
        </label>
        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Chroma <input type="range" min="0" max="0.25" step="0.01" value={params.chroma} onChange={e => updateParam("chroma", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.chroma}</span>
        </label>
        <label className="grid grid-cols-[80px_1fr_36px] items-center gap-2">
          Glint <input type="range" min="0" max="150" step="5" value={params.glint} onChange={e => updateParam("glint", parseFloat(e.target.value))} className="accent-blue-500" /><span className="text-right">{params.glint}</span>
        </label>
      </div>

    </main>
  );
}