"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface LiquidPhysics {
  depth: number;     // 0 - 120
  splay: number;     // 2 - 40
  feather: number;   // 0 - 40
  curve: number;     // 0.3 - 3
  blur: number;      // 0 - 10
  chroma: number;    // 0 - 0.25
  glint: number;     // 0 - 150
}

export const SIMPLE_GLASS: LiquidPhysics = {
  depth: 60,
  splay: 2,
  feather: 24,
  curve: 2,
  blur: 0,
  chroma: 0,
  glint: 25,
};

export const FROSTED_GLASS: LiquidPhysics = {
  depth: 120,
  splay: 16,
  feather: 26,
  curve: 2.6,
  blur: 5,
  chroma: 0,
  glint: 20,
};

interface EngineContextType {
  physics: LiquidPhysics;
  updatePhysics: (updates: Partial<LiquidPhysics>) => void;
  applyPreset: (preset: LiquidPhysics) => void;
  resetPhysics: () => void;
}

const LiquidEngineContext = createContext<EngineContextType | undefined>(undefined);

export function LiquidEngineProvider({ children }: { children: React.ReactNode }) {
  const [physics, setPhysics] = useState<LiquidPhysics>(SIMPLE_GLASS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("liquid-physics-v4");
    if (saved) {
      try { setPhysics(JSON.parse(saved)); } catch (e) {}
    }
    setMounted(true);
  }, []);

  // Sync physics parameters to CSS Custom Variables for 120fps engine updates
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--liquid-depth", `${physics.depth}`);
    root.style.setProperty("--liquid-splay", `${physics.splay}px`);
    root.style.setProperty("--liquid-feather", `${physics.feather}px`);
    root.style.setProperty("--liquid-curve", `${physics.curve}`);
    root.style.setProperty("--liquid-blur", `${physics.blur}px`);
    root.style.setProperty("--liquid-chroma", `${physics.chroma}`);
    root.style.setProperty("--liquid-glint", `${physics.glint}%`);
  }, [physics]);

  const updatePhysics = (updates: Partial<LiquidPhysics>) => {
    setPhysics((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("liquid-physics-v4", JSON.stringify(next));
      return next;
    });
  };

  const applyPreset = (preset: LiquidPhysics) => {
    setPhysics(preset);
    localStorage.setItem("liquid-physics-v4", JSON.stringify(preset));
  };

  const resetPhysics = () => {
    setPhysics(SIMPLE_GLASS);
    localStorage.removeItem("liquid-physics-v4");
  };

  return (
    <LiquidEngineContext.Provider value={{ physics: mounted ? physics : SIMPLE_GLASS, updatePhysics, applyPreset, resetPhysics }}>
      {children}
    </LiquidEngineContext.Provider>
  );
}

export const useLiquidEngine = () => {
  const context = useContext(LiquidEngineContext);
  if (!context) throw new Error("useLiquidEngine must be used within LiquidEngineProvider");
  return context;
};