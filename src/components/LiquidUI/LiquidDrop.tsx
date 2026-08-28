import { cn } from "@/lib/utils";
import React from "react";

interface LiquidDropProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  radius?: string;
  hideTopLeftBorderRadius?: boolean;
}

export function LiquidDrop({
  children,
  className,
  radius = "50px",
  style,
  hideTopLeftBorderRadius = false,
  ...props
}: LiquidDropProps) {
  return (
    <div
      className={cn(
        "relative rounded-(--liquid-radius)",
        hideTopLeftBorderRadius && "rounded-tl-none",
        className
      )}
      style={
        {
          ...style,
          "--liquid-radius": radius,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="hidden dark:block absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          boxShadow: "0 3px 5px 0 rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none"
          style={{
            backdropFilter: "blur(18px) saturate(160%)",
            WebkitBackdropFilter: "blur(18px) saturate(160%)",
            background: "rgba(20, 20, 20, 0.50)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none"
          style={{
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              padding: "1px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        </div>
      </div>


      <div
        className="block dark:hidden absolute inset-0 rounded-[inherit] pointer-events-none"
        style={{
          boxShadow: "0 3px 8px 0 rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none"
          style={{
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            background: "rgba(255, 255, 255, 0.3)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none"
          style={{
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.8)",
          }}
        >
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              padding: "1px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 40%, transparent 100%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        </div>
      </div>

      <div className="relative z-20 h-full w-full">{children}</div>
    </div>
  );
}