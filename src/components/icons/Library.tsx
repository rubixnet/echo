import { forwardRef } from "react";
import type { IconProps } from "./types";

export const Library = forwardRef<SVGSVGElement, IconProps>(
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
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9.2" cy="15.6" r="2.1" />
      <circle cx="15.4" cy="13.6" r="2.1" />
      <path d="M11.3 15.6V8.2" />
      <path d="M17.5 13.6V6.2" />
      <path d="M11.3 8.2 17.5 6.2" />
    </svg>
  )
);
Library.displayName = "Library";
