import { cn } from "@/lib/utils";
import React from "react";

interface LiquidPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  radius?: string;
}

export function LiquidPanel({
  children,
  className,
  radius = "50px",
  style,
  ...props
}: LiquidPanelProps) {
  return (
    <div
      className={cn("relative", className)}
      style={
        {
          ...style,
          "--liquid-radius": radius,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="hidden dark:block absolute inset-0 rounded-(--liquid-radius) pointer-events-none"
        style={{
          boxShadow:
            "inset 0 -1px 4px 0 rgba(255, 255, 255, 0.2), 0 3px 5px 0 rgba(0, 0, 0, 0.4)",
        }}
      >
        <div
          className="absolute inset-0 z-0 rounded-(--liquid-radius) pointer-events-none"
          style={{
            backdropFilter: "blur(12px) saturate(160%)",
            WebkitBackdropFilter: "blur(12px) saturate(160%)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(48,48,48,0.38) 60%, rgba(51,51,51,0.5) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
          style={{
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.15) 0%, transparent 2%)",
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            className="absolute inset-0 rounded-(--liquid-radius)"
            style={{
              padding: "1px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.05) 70%, rgba(255,255,255,0.15) 100%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        </div>
      </div>

      <div
        className="block dark:hidden absolute inset-0 rounded-(--liquid-radius) pointer-events-none"
        style={{
          boxShadow:
            "inset 0 -1px 4px 0 rgba(0, 0, 0, 0.03), 0 3px 5px 0 rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          className="absolute inset-0 z-0 rounded-(--liquid-radius) pointer-events-none"
          style={{
            backdropFilter: "blur(14px) saturate(160%)",
            WebkitBackdropFilter: "blur(14px) saturate(160%)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.22) 60%, rgba(255,255,255,0.15) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
          style={{
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.3) 0%, transparent 7%)",
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.7)",
          }}
        >
          <div
            className="absolute inset-0 rounded-(--liquid-radius)"
            style={{
              padding: "1px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.3) 100%)",
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