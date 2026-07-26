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
    tint: 0.08, 
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
    
    if (refraction) {
      refraction.style.filter = `url(#${filterId})`;
      refraction.style.width = `${MAP_W}px`;
      refraction.style.height = `${MAP_H}px`;
      refraction.style.left = `${-PAD}px`;
      refraction.style.top = `${-PAD}px`;
      refraction.style.clipPath = `inset(${PAD * SS}px round ${RADIUS * SS}px)`;
    }

  }, [dimensions, params, filterId]);

  const activeBg = bgImage ? `url('${bgImage}')` : 'var(--global-app-bg, transparent)';

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none isolate ${className}`} style={{ borderRadius: params.radius }}>
      
      <div 
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          backdropFilter: params.blur > 0 ? `blur(${params.blur}px) saturate(160%)` : "none",
          WebkitBackdropFilter: params.blur > 0 ? `blur(${params.blur}px) saturate(160%)` : "none",
          backgroundColor: params.tint > 0 ? `rgba(255, 255, 255, ${params.tint})` : "rgba(255, 255, 255, 0.03)"
        }}
      />

      <div className="lens-blur absolute inset-0 pointer-events-none opacity-80">
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
          boxShadow: "inset 1.5px 1.5px 4px rgba(255, 255, 255, 0.7), inset -2px -2px 5px rgba(0, 0, 0, 0.28)",
        }}
      />

      <svg className="filter-housing absolute w-0 h-0 pointer-events-none" />
    </div>
  );
}

function DraggableWrapper({ children, initialX, initialY }: { children: ReactNode, initialX: number, initialY: number }) {
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
    setPos({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={`absolute ${isDragging ? "cursor-grabbing z-50" : "cursor-grab z-20"}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className={isDragging ? "pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );
}

export function LiquidButton({ 
  children, 
  bgImage, 
  onClick, 
  preset = "simple", 
  className = "" 
}: { 
  children: ReactNode, 
  bgImage?: string, 
  onClick?: () => void, 
  preset?: GlassPreset,
  className?: string 
}) {
  return (
    <button onClick={onClick} className={`relative group ${className}`}>
      <LiquidBackground bgImage={bgImage} preset={preset} config={{ radius: 12 }} />
      <div className="relative z-10 px-8 py-3 text-white font-medium text-sm tracking-wide shadow-black/50 group-active:scale-95 transition-transform duration-200">
        {children}
      </div>
    </button>
  );
}

export function LiquidContextMenu({ 
  bgImage, 
  items,
  preset = "frosted"
}: { 
  bgImage?: string, 
  items: { label: string, action: () => void }[],
  preset?: GlassPreset
}) {
  return (
    <div className="relative w-64 p-2 shadow-2xl flex flex-col gap-1 rounded-[16px]">
      <LiquidBackground bgImage={bgImage} preset={preset} config={{ radius: 16 }} />
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

export default function UIPlayground() {
  const [bgType, setBgType] = useState<"gradient" | "image" | "dark">("gradient");

  const UNSPALSH_IMG = "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop";
  const GRADIENT_MESH = `
    radial-gradient(at 10% 20%, rgba(236, 72, 153, 0.8) 0px, transparent 50%),
    radial-gradient(at 90% 10%, rgba(59, 130, 246, 0.8) 0px, transparent 50%),
    radial-gradient(at 50% 80%, rgba(168, 85, 247, 0.8) 0px, transparent 50%),
    radial-gradient(at 80% 90%, rgba(16, 185, 129, 0.8) 0px, transparent 50%),
    #09090b
  `;
  const SOLID_DARK = "#09090b";

  const getCssBg = () => {
    if (bgType === "image") return `url('${UNSPALSH_IMG}')`;
    if (bgType === "gradient") return GRADIENT_MESH;
    return SOLID_DARK;
  };

  const activeCssBg = getCssBg();

  return (
    <main 
      className="min-h-screen relative overflow-hidden text-white"
      style={{
        background: activeCssBg,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ['--global-app-bg' as any]: activeCssBg
      }}
    >
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-white/10 p-2 rounded-xl flex gap-2 backdrop-blur-md">
        <button 
          onClick={() => setBgType("gradient")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${bgType === "gradient" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
        >
          Gradient Mesh
        </button>
        <button 
          onClick={() => setBgType("image")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${bgType === "image" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
        >
          Unsplash Photo
        </button>
        <button 
          onClick={() => setBgType("dark")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${bgType === "dark" ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}
        >
          Plain Dark Mode
        </button>
      </div>

      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-center text-xs text-zinc-300 bg-black/60 px-4 py-2 rounded-full border border-white/10 pointer-events-none z-10">
        ✨ Test dragging over the cards below in ANY mode. It now samples real HTML cards!
      </div>

      <DraggableWrapper initialX={60} initialY={140}>
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pl-1">Frosted Menu</span>
          <LiquidContextMenu 
            preset="frosted"
            items={[
              { label: "Badminton Matches", action: () => alert("Matches clicked!") },
              { label: "Player Analytics", action: () => alert("Analytics clicked!") },
              { label: "Sync Status", action: () => alert("Sync clicked!") },
              { label: "Logout DK", action: () => alert("Logout clicked!") },
            ]} 
          />
        </div>
      </DraggableWrapper>

      <DraggableWrapper initialX={360} initialY={140}>
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 pl-1">Frosted Navbar</span>
          <div className="relative w-80 p-3 flex items-center justify-between rounded-[16px]">
            <LiquidBackground preset="frosted" config={{ radius: 16 }} />
            <span className="relative z-10 text-xs font-bold text-white px-2 py-1">Home</span>
            <span className="relative z-10 text-xs font-bold text-zinc-300 px-2 py-1">Search</span>
            <span className="relative z-10 text-xs font-bold text-zinc-300 px-2 py-1">Library</span>
            <span className="relative z-10 text-xs font-bold text-zinc-300 px-2 py-1">Settings</span>
          </div>
        </div>
      </DraggableWrapper>

      <div className="absolute top-72 left-12 right-12 grid grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-500/80 to-purple-600/80 border border-pink-500/50 space-y-2 shadow-xl">
          <h2 className="text-xl font-bold text-white">Vibrant Pink Card</h2>
          <p className="text-xs text-pink-100 leading-relaxed">
            Drag the menu over this pink card in ANY mode. You will see the pink background AND white text blur directly through the glass.
          </p>
        </div>


        <div className="p-6 rounded-2xl bg-zinc-800 border border-white/20 space-y-2 shadow-xl">
          <h2 className="text-xl font-bold text-emerald-400">High-Contrast Text</h2>
          <p className="text-xs text-zinc-300 leading-relaxed">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />
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
    </main>
  );
} 
