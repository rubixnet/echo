"use client";

import React, { useEffect, useRef, useState, ReactNode, useId } from "react";

export interface LensParams {
  depth: number;
  splay: number;
  feather: number;
  curve: number;
  blur: number;
  chroma: number;
  glint: number;
  tint: number;
  tintColor: string;
}

export type GlassPreset = "simple" | "frosted";

export const GLASS_PRESETS: Record<GlassPreset, LensParams> = {
  simple: { 
    depth: 120,     
    splay: 2, 
    feather: 42,    
    curve: 3.2,     
    blur: 0, 
    chroma: 0, 
    glint: 35,      
    tint: 0, 
    tintColor: "#ffffff" 
  },
  frosted: { 
    depth: 120, 
    splay: 16, 
    feather: 26, 
    curve: 2.6, 
    blur: 12, 
    chroma: 0.08, 
    glint: 20, 
    tint: 0.1, 
    tintColor: "#ffffff" 
  },
};

interface LiquidConfig extends Partial<LensParams> {
  radius?: number;
}

export function LiquidBackground({ 
  preset = "frosted",
  config = {}, 
  className = "",
  bgImage
}: { 
  preset?: GlassPreset;
  config?: LiquidConfig;
  className?: string;
  bgImage?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  
  const rawId = useId();
  const filterId = `lens-filter-${rawId.replace(/:/g, "")}`;

  const baseParams = GLASS_PRESETS[preset] || GLASS_PRESETS.frosted;
  const params = { ...baseParams, radius: 16, ...config };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dimensions.w === 0 || dimensions.h === 0 || !containerRef.current) return;
    
    const root = containerRef.current;
    const housing = root.querySelector<SVGSVGElement>(".filter-housing")!;
    const refraction = root.querySelector<HTMLDivElement>(".lens-refraction")!;
    
    const LENS_W = dimensions.w;
    const LENS_H = dimensions.h;
    const RADIUS = params.radius!;
    const BOOST = 0.8;
    const PAD = 20;
    const SS = 1;

    const MAP_W = (LENS_W + 2 * PAD) * SS;
    const MAP_H = (LENS_H + 2 * PAD) * SS;

    const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

    function buildLensMap() {
      const cv = document.createElement("canvas");
      cv.width = MAP_W; cv.height = MAP_H;
      const ctx = cv.getContext("2d")!;
      const img = ctx.createImageData(MAP_W, MAP_H), px = img.data;

      const hx = (LENS_W * SS) / 2, hy = (LENS_H * SS) / 2;
      const sdf = (x: number, y: number) => {
        const qx = Math.abs(x - MAP_W / 2) - (hx - RADIUS * SS);
        const qy = Math.abs(y - MAP_H / 2) - (hy - RADIUS * SS);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - RADIUS * SS;
      };

      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const cx = x + 0.5, cy = y + 0.5;
          const s = sdf(cx, cy);
          const gx = sdf(cx + 1, cy) - sdf(cx - 1, cy);
          const gy = sdf(cx, cy + 1) - sdf(cx, cy - 1);
          const len = Math.hypot(gx, gy) || 1;
          const nx = gx / len, ny = gy / len;
          const span = s < 0 ? (params.splay * SS) + (params.feather * SS) : (params.splay * SS);
          let amt = Math.max(0, 1 - Math.abs(s) / span);
          amt = amt * amt * amt * (amt * (amt * 6 - 15) + 10);
          amt = Math.pow(amt, params.curve);
          const i = (y * MAP_W + x) * 4;
          px[i]     = clamp255(Math.round(127.5 - nx * amt * 127 * BOOST));
          px[i + 1] = clamp255(Math.round(127.5 - ny * amt * 127 * BOOST));
          px[i + 2] = 128;
          px[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return cv.toDataURL("image/png");
    }

    const mapUrl = buildLensMap();
    const sc = params.depth * SS;
    const chroma = params.chroma;

    let disp = "";
    if (chroma > 0) {
      const sR = sc * (1 + chroma), sB = sc * (1 - chroma);
      disp = `
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${sR}" xChannelSelector="R" yChannelSelector="G" result="dR"/>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${sB}" xChannelSelector="R" yChannelSelector="G" result="dGB"/>
        <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>
        <feColorMatrix in="dGB" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cGB"/>
        <feComposite in="cR" in2="cGB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="disp"/>`;
    } else {
      disp = `<feDisplacementMap in="SourceGraphic" in2="map" scale="${sc}" xChannelSelector="R" yChannelSelector="G" result="disp"/>`;
    }

    housing.innerHTML = `
      <defs>
        <filter id="${filterId}" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
          <feImage href="${mapUrl}" xlink:href="${mapUrl}" x="0" y="0" width="${MAP_W}" height="${MAP_H}" preserveAspectRatio="none" result="map"/>
          ${disp}
        </filter>
      </defs>`;
    
    refraction.style.filter = `url(#${filterId})`;
    refraction.style.width = `${MAP_W}px`;
    refraction.style.height = `${MAP_H}px`;
    refraction.style.left = `${-PAD}px`;
    refraction.style.top = `${-PAD}px`;
    refraction.style.clipPath = `inset(${PAD * SS}px round ${RADIUS * SS}px)`;

  }, [dimensions, params, filterId]);

  const activeBg = bgImage ? `url('${bgImage}')` : 'var(--app-bg)';

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none isolate ${className}`} style={{ borderRadius: params.radius }}>
      <div 
        className="lens-blur absolute inset-0" 
        style={{ filter: params.blur > 0 ? `blur(${params.blur}px)` : "none" }}
      >
        <div 
          className="lens-refraction absolute pointer-events-none" 
          style={{ 
             backgroundImage: activeBg,
             backgroundAttachment: 'fixed',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
          }} 
        />
      </div>

      <div className="absolute inset-0 rounded-[inherit] pointer-events-none mix-blend-multiply" style={{ background: params.tintColor, opacity: params.tint }} />
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          opacity: Math.min(1, params.glint / 100),
          boxShadow: "inset 1.5px 1.5px 4px rgba(255, 255, 255, .7), inset -2px -2px 5px rgba(0, 0, 0, .28)",
        }}
      />
      <svg className="filter-housing absolute w-0 h-0" />
    </div>
  );
}

export function LiquidContextMenu({ 
  items,
  preset = "frosted",
  className = ""
}: { 
  items: { label: string, action: () => void }[],
  preset?: GlassPreset,
  className?: string
}) {
  return (
    <div className={`relative w-64 p-2 shadow-2xl flex flex-col gap-1 rounded-[16px] ${className}`}>
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