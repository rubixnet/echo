"use client";

import React, { useEffect, useRef, forwardRef, useState, useId } from "react";
import { cn } from "@/lib/utils";

export type LensParams = {
  depth: number;
  splay: number;
  feather: number;
  curve: number;
  blur: number;
  chroma: number;
  glint: number;
  tint: number;
  tintColor: string;
};

export type GlassPreset = "soft" | "thick" | "frosted" | "cut" | "plexi" | "simple";

export const GLASS_PRESETS: Record<GlassPreset, LensParams> = {
  soft: { depth: 60, splay: 2, feather: 24, curve: 2, blur: 0, chroma: 0, glint: 25, tint: 0, tintColor: "#ffffff" },
  thick: { depth: 120, splay: 2, feather: 30, curve: 3, blur: 0, chroma: 0.05, glint: 60, tint: 0, tintColor: "#ffffff" },
  frosted: { depth: 120, splay: 16, feather: 26, curve: 2.6, blur: 5, chroma: 0.08, glint: 20, tint: 0, tintColor: "#ffffff" },
  cut: { depth: 120, splay: 40, feather: 40, curve: 0.6, blur: 0.05, chroma: 0, glint: 15, tint: 0, tintColor: "#ffffff" },
  plexi: { depth: 60, splay: 4, feather: 10, curve: 1.2, blur: 2.5, chroma: 0, glint: 25, tint: 0.94, tintColor: "#ff6600" },
  simple: { depth: 120, splay: 2, feather: 42, curve: 3.2, blur: 0, chroma: 0, glint: 35, tint: 0, tintColor: "#ffffff" },
};

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  preset?: GlassPreset;
  customParams?: Partial<LensParams>;
  radius?: number; 
  bgImage?: string; 
  className?: string;
  draggable?: boolean;
  initialX?: number;
  initialY?: number;
}

const BOOST = 0.8;
const PAD = 20;
const SS = 1;
const mapCache = new Map<string, string>();
const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

function buildLensMap(mw: number, mh: number, winW: number, winH: number, radius: number, rim: number, curve: number, feather: number) {
  if (mw <= 0 || mh <= 0) return "";
  
  const key = `${mw}:${winW}:${radius}:${rim}:${curve}:${feather}`;
  if (mapCache.has(key)) return mapCache.get(key)!;
  
  const cv = document.createElement("canvas");
  cv.width = mw; cv.height = mh;
  const ctx = cv.getContext("2d");
  if (!ctx) return "";

  const img = ctx.createImageData(mw, mh), px = img.data;
  const hx = winW / 2, hy = winH / 2;

  const sdf = (x: number, y: number) => {
    const qx = Math.abs(x - mw / 2) - (hx - radius);
    const qy = Math.abs(y - mh / 2) - (hy - radius);
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius;
  };

  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      const s = sdf(cx, cy);
      const gx = sdf(cx + 1, cy) - sdf(cx - 1, cy);
      const gy = sdf(cx, cy + 1) - sdf(cx, cy - 1);
      const len = Math.hypot(gx, gy) || 1;
      const nx = gx / len, ny = gy / len;
      const span = s < 0 ? rim + feather : rim;
      let amt = Math.max(0, 1 - Math.abs(s) / span);
      amt = amt * amt * amt * (amt * (amt * 6 - 15) + 10);
      amt = Math.pow(amt, curve);
      
      const i = (y * mw + x) * 4;
      px[i]     = clamp255(Math.round(127.5 - nx * amt * 127 * BOOST));
      px[i + 1] = clamp255(Math.round(127.5 - ny * amt * 127 * BOOST));
      px[i + 2] = 128;
      px[i + 3] = 255;
    }
  }
  
  ctx.putImageData(img, 0, 0);
  const url = cv.toDataURL("image/png");
  if (mapCache.size > 300) mapCache.delete(mapCache.keys().next().value!);
  mapCache.set(key, url);
  return url;
}

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  ({ children, preset = "simple", customParams, radius = 20, bgImage, className = "", style, draggable = false, initialX = 0, initialY = 0, ...props }, ref) => {
    
    const containerRef = useRef<HTMLDivElement>(null);
    const housingRef = useRef<SVGSVGElement>(null);
    const refractionRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
    
    const rawId = useId();
    const filterId = `lens-filter-${rawId.replace(/:/g, "")}`;

    const [pos, setPos] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });

    React.useImperativeHandle(ref, () => containerRef.current!);

    const basePreset = GLASS_PRESETS[preset as GlassPreset] || GLASS_PRESETS.soft;
    const params: LensParams = { ...basePreset, ...customParams };

    useEffect(() => {
      const updateLayout = () => {
        const root = containerRef.current;
        if (!root) return;
        const w = root.clientWidth;
        const h = root.clientHeight;
        if (w > 0 && h > 0) {
            setDimensions(prev => prev.w === w && prev.h === h ? prev : { w, h });
        }
      };

      updateLayout();
      const observer = new ResizeObserver(updateLayout);
      if (containerRef.current) observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      if (dimensions.w === 0 || dimensions.h === 0 || !housingRef.current || !refractionRef.current) return;

      const LENS_W = dimensions.w;
      const LENS_H = dimensions.h;
      const MAP_W = (LENS_W + 2 * PAD) * SS;
      const MAP_H = (LENS_H + 2 * PAD) * SS;

      const mapUrl = buildLensMap(MAP_W, MAP_H, LENS_W * SS, LENS_H * SS, radius * SS, params.splay * SS, params.curve, params.feather * SS);
      if (!mapUrl) return;

      const sc = params.depth * SS;
      let disp = "";

      if (params.chroma > 0) {
        const sR = sc * (1 + params.chroma);
        const sB = sc * (1 - params.chroma);
        disp = `
          <feDisplacementMap in="SourceGraphic" in2="map" scale="${sR}" xChannelSelector="R" yChannelSelector="G" result="dR"/>
          <feDisplacementMap in="SourceGraphic" in2="map" scale="${sB}" xChannelSelector="R" yChannelSelector="G" result="dGB"/>
          <feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>
          <feColorMatrix in="dGB" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cGB"/>
          <feComposite in="cR" in2="cGB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="disp"/>`;
      } else {
        disp = `<feDisplacementMap in="SourceGraphic" in2="map" scale="${sc}" xChannelSelector="R" yChannelSelector="G" result="disp"/>`;
      }

      housingRef.current.innerHTML = `
        <defs>
          <filter id="${filterId}" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">
            <feImage href="${mapUrl}" xlink:href="${mapUrl}" x="0" y="0" width="${MAP_W}" height="${MAP_H}" preserveAspectRatio="none" result="map"/>
            ${disp}
          </filter>
        </defs>`;

      refractionRef.current.style.filter = `url(#${filterId})`;
      refractionRef.current.style.width = `${MAP_W}px`;
      refractionRef.current.style.height = `${MAP_H}px`;
      refractionRef.current.style.left = `-${PAD}px`;
      refractionRef.current.style.top = `-${PAD}px`;
      refractionRef.current.style.clipPath = `inset(${PAD * SS}px round ${radius * SS}px)`;
    }, [params, radius, dimensions, filterId]);

    const handlePointerDown = (e: React.PointerEvent) => {
      if (!draggable) return;
      setIsDragging(true);
      startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging) return;
      setPos({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (!draggable) return;
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    return (
      <div
        ref={containerRef}
        className={cn(
          "isolate", 
          draggable ? "absolute z-50" : "relative",
          draggable && (isDragging ? "cursor-grabbing" : "cursor-grab"),
          className
        )}
        style={{ 
          borderRadius: `${radius}px`, 
          ...(draggable ? { left: pos.x, top: pos.y } : {}),
          ...style 
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        {...props}
      >
        <svg ref={housingRef} width="0" height="0" className="absolute pointer-events-none" />

        <div className="absolute inset-0 pointer-events-none z-0" style={{ clipPath: `inset(0 round ${radius}px)` }}>
          
          <div className="absolute inset-0" style={{ filter: params.blur > 0 ? `blur(${params.blur}px)` : "none" }}>
            <div ref={refractionRef} className="absolute pointer-events-none">
              
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: bgImage ? `url('${bgImage}')` : "none",
                  backgroundAttachment: 'fixed',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
          </div>
          
          <div 
            className="absolute inset-0 rounded-[inherit] pointer-events-none mix-blend-multiply" 
            style={{ background: params.tintColor, opacity: `${params.tint}` }}
          />
          <div 
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{ 
              opacity: `${Math.min(1, params.glint / 100)}`,
              boxShadow: "inset 1.5px 1.5px 4px rgba(255, 255, 255, .7), inset -2px -2px 5px rgba(0, 0, 0, .28)" 
            }}
          />
        </div>

        <div className={cn("relative z-10 w-full h-full flex flex-col items-center justify-center", isDragging && "pointer-events-none")}>
          {children}
        </div>
      </div>
    );
  }
);

LiquidGlass.displayName = "LiquidGlass";