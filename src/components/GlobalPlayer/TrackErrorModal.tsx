"use client";

import { useEffect, useState } from "react";
import { useAudioEngine } from "@/components/providers/AudioProvider";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { TriangleAlert } from "lucide-react";
import { LiquidPanel } from "@/components/LiquidUI/LiquidPanel";
import { Button } from "@/components/ui/button";

export function TrackErrorModal() {
  const { setOnTrackError } = useAudioEngine();
  const { playNext } = useGlobalPlayback();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setOnTrackError(() => {
      setIsOpen(true);
    });
  }, [setOnTrackError]);

  if (!isOpen) return null;

  const handleTryAnother = () => {
    setIsOpen(false);
    playNext(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <LiquidPanel
        radius="24px"
        className="w-full max-w-md animate-in zoom-in-95 duration-200"
      >
        <div className="relative p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <TriangleAlert size={32} />
          </div>

          <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
            Can&apos;t Play This Track
          </h2>
          <p className="text-sm text-foreground/60 font-medium mb-6 max-w-[300px] leading-relaxed">
            There was a problem loading the audio for this song. Try playing a
            different song — and if the issue keeps happening, run it locally.
          </p>

          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Dismiss
            </Button>
            <Button className="flex-1" onClick={handleTryAnother}>
              Try Another Song
            </Button>
          </div>
        </div>
      </LiquidPanel>
    </div>
  );
}