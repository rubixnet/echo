import { forwardRef } from "react";
import type { IconProps } from "./types";

export const SkipForward = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, fill, fillOpacity, stroke, strokeWidth = 2, color, solid, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={fill ?? (solid ? "currentColor" : "none")}
      fillOpacity={fillOpacity ?? (solid ? 1 : undefined)}
      color={color}
      stroke={stroke ?? "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 4v16" />
      <path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />
    </svg>
  )
);
SkipForward.displayName = "SkipForward";
