"use client";

import { useEffect, useState } from "react";
import { useRoomState } from "@/hooks/useRoomState";
import { Radio, X, LogOut } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";

export function GuestModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { leaveRoom, room } = useRoomState();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("openLockdownModal", handleOpen);
    return () => window.removeEventListener("openLockdownModal", handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleLeave = async () => {
    if (leaveRoom) await leaveRoom();
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <LiquidContainer
        radius="24px"
        className="w-full max-w-md  animate-in zoom-in-95 duration-200"
      >
        <div className="relative p-6 flex flex-col items-center text-center bg-foreground/[0.02]">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20 ">
            <Radio size={32} className="animate-pulse" />
          </div>

          <h2 className="text-lg font-bold text-foreground tracking-tight mb-2">
            Listening Live
          </h2>
          <p className="text-sm font-medium text-foreground/60 mb-6 max-w-[280px]">
            Your playback controls are locked to stay synced with the host!
          </p>

          <div className="flex w-full gap-3">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 h-11 bg-foreground/5 hover:bg-foreground/10 text-foreground text-xs font-bold rounded-xl transition-colors"
            >
              Stay in Room
            </button>
            <button
              onClick={handleLeave}
              className="flex-1 h-11 bg-foreground text-background text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-transform flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Leave Room
            </button>
          </div>
        </div>
      </LiquidContainer>
    </div>
  );
}
