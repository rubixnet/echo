import { forwardRef } from "react";
import type { IconProps } from "./types";

export const PenLine = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, strokeWidth, fill = "currentColor", color, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      width={size}
      height={size}
      className={className}
      fill={fill}
      color={color}
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d="M1.94385 10.7153L0.337891 11.3652C0.280599 11.3903 0.223307 11.3885 0.166016 11.3599C0.108724 11.3312 0.0657552 11.2882 0.0371094 11.231C0.0120443 11.1737 0.0120443 11.1146 0.0371094 11.0537L0.719238 9.49072L8.604 1.61133L9.82861 2.83594L1.94385 10.7153ZM10.457 2.22363L9.21631 0.993652L9.92529 0.300781C10.0972 0.128906 10.2744 0.0358073 10.457 0.0214844C10.6432 0.00716146 10.8169 0.0805664 10.978 0.241699L11.209 0.472656C11.3701 0.633789 11.4453 0.807454 11.4346 0.993652C11.4274 1.17627 11.3343 1.35531 11.1553 1.53076L10.457 2.22363Z" fill="inherit" fillOpacity="0.6" />
    </svg>
  )
);
PenLine.displayName = "PenLine";
