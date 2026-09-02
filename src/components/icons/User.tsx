import { forwardRef } from "react";
import type { IconProps } from "./types";

export const User = forwardRef<SVGSVGElement, IconProps>(
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
);
User.displayName = "User";
