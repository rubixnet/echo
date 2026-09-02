import { forwardRef } from "react";
import type { IconProps } from "./types";

export const Lyrics = forwardRef<SVGSVGElement, IconProps>(
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
      <circle cx="5" cy="14.5" r="1.8" />
      <path d="M6.8 14.5V5.5" />
      <path d="M6.8 5.5h4" />
      <path d="M13 14.5h8" />
      <path d="M13 18h6" />
    </svg>
  )
);
Lyrics.displayName = "Lyrics";
