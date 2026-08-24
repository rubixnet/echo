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
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(48,48,48,0.65) 60%, rgba(51,51,51,0.8) 100%)",
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
                "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.1) 100%)",
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
            "inset 0 -1px 4px 0 rgba(0, 0, 0, 0.05), 0 3px 5px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          className="absolute inset-0 z-0 rounded-(--liquid-radius) pointer-events-none"
          style={{
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 60%, rgba(255,255,255,0.4) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
          style={{
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 7%)",
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)",
          }}
        >
          <div
            className="absolute inset-0 rounded-(--liquid-radius)"
            style={{
              padding: "1px",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.02) 70%, rgba(0,0,0,0.1) 100%)",
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
