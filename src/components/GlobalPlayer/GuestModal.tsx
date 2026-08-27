"use client";

import { useRoomState } from "@/hooks/useRoomContext";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { Radio, LogOut } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { Button } from "@/components/ui/button";

export function GuestModal() {
  const { isLockdownOpen, closeLockdown, leaveRoom } = useRoomState();
  const { pause } = useAudioEngine();

  if (!isLockdownOpen) return null;

  const handleLeave = async () => {
    try {
      pause();
      await leaveRoom();
    } finally {
      closeLockdown();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <LiquidContainer
        radius="24px"
        className="w-full max-w-md animate-in zoom-in-95 duration-200"
      >
        <div className="relative p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4">
            <Radio size={32} className="animate-pulse" />
          </div>

          <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
            Listening Live
          </h2>
          <p className="text-sm text-foreground/60 font-medium mb-6 max-w-[280px] leading-relaxed">
            Playback is controlled by the host so everyone stays in sync.
          </p>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={closeLockdown}
            >
              Stay in Room
            </Button>
            <Button className="flex-1" onClick={handleLeave}>
              <LogOut size={16} /> Leave Room
            </Button>
          </div>
        </div>
      </LiquidContainer>
    </div>
  );
}
