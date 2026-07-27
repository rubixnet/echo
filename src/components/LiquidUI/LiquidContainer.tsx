"use client";

import React from "react";
import { GlassSurface } from "./GlassSurface";
import { LiquidPhysics } from "./LiquidEngine";

interface LiquidContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: string;
  localPhysics?: Partial<LiquidPhysics>;
  children: React.ReactNode;
}

export const LiquidContainer = ({
  radius = "16px",
  localPhysics,
  className,
  children,
  ...props
}: LiquidContainerProps) => {
  return (
    <GlassSurface radius={radius} localPhysics={localPhysics} className={className} {...props}>{children}</GlassSurface>
  );
};
