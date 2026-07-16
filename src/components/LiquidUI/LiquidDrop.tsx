import { cn } from "@/lib/utils";
import React from "react";

interface LiquidDropProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    radius?: string;
}

export function LiquidDrop({
    children,
    className,
    radius = "50px",
    style,
    ...props
}: LiquidDropProps) {
    return (
        <div
            className={cn("relative", className)}
            style={{ ...style, ["--liquid-radius" as any]: radius }}
            {...props}
        >
            <div
                className="hidden dark:block absolute inset-0 rounded-(--liquid-radius) pointer-events-none"
                style={{
                    boxShadow: "0 3px 5px 0 rgba(0, 0, 0, 0.4)",
                }}
            >
                <div
                    className="absolute inset-0 z-0 rounded-(--liquid-radius) pointer-events-none"
                    style={{
                        backdropFilter: "blur(24px) saturate(150%)",
                        WebkitBackdropFilter: "blur(24px) saturate(150%)",
                        background: "rgba(20, 20, 20, 0.4)", 
                    }}
                />
                <div
                    className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
                    style={{
                        boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
                    }}
                >
                    <div
                        className="absolute inset-0 rounded-(--liquid-radius)"
                        style={{
                            padding: "1px",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />
                </div>
            </div>
            <div
                className="block dark:hidden absolute inset-0 rounded-(--liquid-radius) pointer-events-none"
                style={{
                    boxShadow: "0 3px 5px 0 rgba(0, 0, 0, 0.1)",
                }}
            >
                <div
                    className="absolute inset-0 z-0 rounded-(--liquid-radius) pointer-events-none"
                    style={{
                        backdropFilter: "blur(24px) saturate(150%)",
                        WebkitBackdropFilter: "blur(24px) saturate(150%)",
                        background: "rgba(255, 255, 255, 0.55)", 
                    }}
                />
                <div
                    className="absolute inset-0 z-10 rounded-(--liquid-radius) pointer-events-none"
                    style={{
                        boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)",
                    }}
                >
                    <div
                        className="absolute inset-0 rounded-(--liquid-radius)"
                        style={{
                            padding: "1px",
                            background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.02) 40%, transparent 100%)",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
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