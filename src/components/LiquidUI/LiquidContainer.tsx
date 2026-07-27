import { cn } from "@/lib/utils";
import React from "react";

interface LiquidContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  radius?: string;
}


export function LiquidContainer({
  children,
  className,
  radius = "50px",
  style,
  ...props
}: LiquidContainerProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ ...style, ["--liquid-radius" as any]: radius }}
      {...props}
    >
      <div
        className="hidden dark:block absolute inset-0 rounded-(--liquid-radius) pointer-events-none"
        style={{
          boxShadow:
            "inset 0 -1px 4px 0 rgba(255, 255, 255, 0.2), 0 3px 5px 0 rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          className="absolute inset-0 z-0 rounded-(--liquid-radius) pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(48,48,48,0.35) 60%, rgba(51,51,51,0.2) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
          style={{
            WebkitBackdropFilter: "blur(18px) saturate(120%)",
            background:
              "linear-gradient(0deg, rgba(255,255,255,0.15) 0%, transparent 8%)",
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            className="absolute inset-0 rounded-(--liquid-radius)"
            style={{
              padding: "1px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.1) 100%)",
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
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.1) 100%)",
          }}
        />
        <div
          className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
          style={{
            WebkitBackdropFilter: "blur(18px) saturate(120%)",
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