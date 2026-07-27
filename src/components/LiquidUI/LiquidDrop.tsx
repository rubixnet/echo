import React from "react";
import { GlassSurface } from "./GlassSurface";

export function LiquidDrop({ children, className, radius = "50px", style, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode; radius?: string }) {
  return <GlassSurface variant="frosted" radius={radius} className={className} style={style} {...props}>{children}</GlassSurface>;
}
