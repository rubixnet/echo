"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LiquidPhysics, SIMPLE_GLASS, useLiquidEngine } from "./LiquidEngine";

export type GlassVariant = "simple" | "frosted";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  radius?: string;
  variant?: GlassVariant;
  localPhysics?: Partial<LiquidPhysics>;
}

/** One optical stack used by every Liquid UI surface. Tint is intentionally omitted. */
export function GlassSurface({
  children,
  className,
  radius = "16px",
  variant = "simple",
  localPhysics,
  style,
  ...props
}: GlassSurfaceProps) {
  const { physics: globalPhysics } = useLiquidEngine();
  const preset = variant === "frosted" ? { ...globalPhysics, blur: 5, depth: 120, splay: 16, feather: 26, curve: 2.6, glint: 20 } : { ...SIMPLE_GLASS, ...globalPhysics };
  const p = { ...preset, ...localPhysics };
  const depth = Math.min(1, p.depth / 120);
  const glint = Math.min(1, p.glint / 100);
  const blur = Math.max(0, p.blur);
  const edge = Math.max(2, p.splay);
  const feather = Math.max(8, p.feather);

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{ ...style, borderRadius: radius, boxShadow: `0 14px 35px rgba(0,0,0,${0.16 + depth * 0.14}), inset 0 1px 0 rgba(255,255,255,${0.16 + glint * 0.18})` }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "inherit",
          background: `linear-gradient(145deg, rgba(255,255,255,${0.15 + glint * 0.12}) 0%, rgba(255,255,255,${0.035 + depth * 0.025}) 32%, rgba(20,24,30,${0.12 + depth * 0.12}) 100%), radial-gradient(ellipse at 14% 0%, rgba(255,255,255,${0.18 * glint}) 0%, transparent 48%)`,
          backdropFilter: `blur(${blur}px) saturate(${112 + depth * 28}%)`,
          WebkitBackdropFilter: `blur(${blur}px) saturate(${112 + depth * 28}%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: "inherit",
          padding: "1px",
          background: `linear-gradient(135deg, rgba(255,255,255,${0.38 * glint}) 0%, rgba(255,255,255,${0.08 * glint}) ${edge + 10}%, transparent 48%, rgba(0,0,0,${0.16 * depth}) 100%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          boxShadow: `inset 0 0 ${feather}px rgba(255,255,255,${0.06 + glint * 0.1}), inset 0 0 ${feather * 1.4}px rgba(0,0,0,${0.08 + depth * 0.1})`,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
