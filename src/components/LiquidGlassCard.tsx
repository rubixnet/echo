"use client";

import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";
import { LiquidGlass, LensParams, GlassPreset } from "./LiquidGlass";

function parseRadius(radiusStr?: string | number): number {
  if (typeof radiusStr === "number") return radiusStr;
  if (!radiusStr) return 20;
  const parsed = parseInt(radiusStr.toString(), 10);
  return isNaN(parsed) ? 20 : parsed;
}

export interface CommonLiquidProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  radius?: string | number;
  preset?: GlassPreset;
  customParams?: Partial<LensParams>;
  draggable?: boolean;
  initialX?: number; 
  initialY?: number; 
  bgImage?: string;
}

const BaseLiquidComponent = forwardRef<HTMLDivElement, CommonLiquidProps>(
  (
    {
      children,
      className,
      radius = 50,
      preset = "simple",
      customParams,
      draggable,
      initialX,
      initialY,
      bgImage,
      style,
      ...props
    },
    ref
  ) => {
    const numericRadius = parseRadius(radius);
    const radiusCssVar = typeof radius === "number" ? `${radius}px` : radius;

    return (
      <LiquidGlass
        ref={ref}
        preset={preset}
        customParams={customParams}
        radius={numericRadius} 
        draggable={draggable}
        initialX={initialX}
        initialY={initialY}
        bgImage={bgImage}
        className={cn("w-full h-full", className)}
        style={{ ...style, ["--liquid-radius" as any]: radiusCssVar }}
        {...props}
      >
        {children}
      </LiquidGlass>
    );
  }
);
BaseLiquidComponent.displayName = "BaseLiquidComponent";


export const LiquidPanel = forwardRef<HTMLDivElement, CommonLiquidProps>(
  ({ children, className, radius = 50, preset = "frosted", ...props }, ref) => (
    <BaseLiquidComponent
      ref={ref}
      preset={preset}
      radius={radius}
      className={cn("bg-white/[0.16] shadow-[0_24px_60px_rgba(15,23,42,0.24)] border-white/30", className)}
      {...props}
    >
      {children}
    </BaseLiquidComponent>
  )
);
LiquidPanel.displayName = "LiquidPanel";

export const LiquidDrop = forwardRef<HTMLDivElement, CommonLiquidProps>(
  ({ children, className, radius = 50, preset = "thick", ...props }, ref) => (
    <BaseLiquidComponent
      ref={ref}
      preset={preset}
      radius={radius}
      className={className}
      {...props}
    >
      {children}
    </BaseLiquidComponent>
  )
);
LiquidDrop.displayName = "LiquidDrop";

export const LiquidContainer = forwardRef<HTMLDivElement, CommonLiquidProps>(
  ({ children, className, radius = 50, preset = "soft", ...props }, ref) => (
    <BaseLiquidComponent
      ref={ref}
      preset={preset}
      radius={radius}
      className={cn("bg-white/[0.14] shadow-[0_18px_38px_rgba(15,23,42,0.18)] border-white/25", className)}
      {...props}
    >
      {children}
    </BaseLiquidComponent>
  )
);
LiquidContainer.displayName = "LiquidContainer";

export const LiquidGlassCard = BaseLiquidComponent;