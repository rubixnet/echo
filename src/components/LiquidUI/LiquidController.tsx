"use client";

import React, { useState, useRef } from "react";
import { LiquidContainer } from "./LiquidContainer";
import { useLiquidEngine, LiquidPhysics, SIMPLE_GLASS, FROSTED_GLASS } from "./LiquidEngine";

export const LiquidController = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { physics, updatePhysics, applyPreset, resetPhysics } = useLiquidEngine();

  // Draggable Window State
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow dragging from the header handle
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = dragRef.current.startX - e.clientX;
    const dy = dragRef.current.startY - e.clientY;
    setPosition({
      x: Math.max(10, dragRef.current.posX + dx),
      y: Math.max(10, dragRef.current.posY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(physics, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Custom Range Slider with smooth mouse/touch dragging
  const Slider = ({
    label,
    prop,
    min,
    max,
    step = 1,
  }: {
    label: string;
    prop: keyof LiquidPhysics;
    min: number;
    max: number;
    step?: number;
  }) => (
    <div className="flex flex-col gap-1.5 mb-3 select-none">
      <div className="flex justify-between items-center text-[11px] font-bold text-white/80">
        <label className="uppercase tracking-wider text-[10px] text-white/60">{label}</label>
        <span className="font-mono text-white text-[11px]">{Number(physics[prop]).toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={physics[prop]}
        onInput={(e) => updatePhysics({ [prop]: Number((e.target as HTMLInputElement).value) })}
        onChange={(e) => updatePhysics({ [prop]: Number(e.target.value) })}
        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-grab active:cursor-grabbing accent-emerald-400"
      />
    </div>
  );

  return (
    <div
      className="fixed z-[9999] flex flex-col items-end gap-3 touch-none"
      style={{ right: `${position.x}px`, bottom: `${position.y}px` }}
    >
      {isOpen && (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-200">
          <LiquidContainer
            radius="16px"
            localPhysics={{ blur: 20, glint: 40, depth: 30, feather: 12, splay: 2 }}
            className="w-[290px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-white/15 bg-black/85 text-white"
          >
            {/* DRAGGABLE HEADER */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="px-4 py-3 border-b border-white/10 flex items-center justify-between cursor-grab active:cursor-grabbing bg-white/5 select-none"
            >
              <div className="flex items-center gap-2">
                {/* Drag Grip Lines Icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-white/40">
                  <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                </svg>
                <span className="text-[11px] font-black uppercase tracking-wider text-white/90">Lens Physics Engine</span>
              </div>
              <button onClick={resetPhysics} title="Reset Defaults" className="text-white/40 hover:text-white transition-colors text-xs font-bold">
                Reset
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-1 custom-scrollbar">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => applyPreset(SIMPLE_GLASS)}
                  className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[10px] font-extrabold rounded-md transition-all border border-white/5"
                >
                  Simple Glass
                </button>
                <button
                  onClick={() => applyPreset(FROSTED_GLASS)}
                  className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[10px] font-extrabold rounded-md transition-all border border-white/5"
                >
                  Frosted Glass
                </button>
              </div>

              <Slider label="Depth" prop="depth" min={0} max={120} />
              <Slider label="Splay" prop="splay" min={2} max={40} />
              <Slider label="Feather" prop="feather" min={0} max={40} />
              <Slider label="Curvature" prop="curve" min={0.3} max={3} step={0.1} />
              <Slider label="Blur" prop="blur" min={0} max={10} step={0.1} />
              <Slider label="Chromatic" prop="chroma" min={0} max={0.25} step={0.01} />
              <Slider label="Glint" prop="glint" min={0} max={150} step={5} />

              <button
                onClick={copyConfig}
                className="w-full mt-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {copied ? "Copied JSON to Clipboard!" : "Export Production Config"}
              </button>
            </div>
          </LiquidContainer>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center shadow-2xl border border-white/20 hover:scale-105 active:scale-95 transition-all"
        aria-label="Toggle Glass Settings"
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )}
      </button>
    </div>
  );
};