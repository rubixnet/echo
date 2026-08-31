"use client";

import { useUser } from "@/hooks/useUser";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface SlidingSegmentProps {
  options: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
}

export function SlidingSegment({
  options,
  activeIndex,
  onChange,
  className,
}: SlidingSegmentProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(activeIndex);
  const isInitialRender = useRef(true);
  const animationRef = useRef<Animation | null>(null);

  const segmentCount = options.length || 1;
  const segmentWidth = 100 / segmentCount;

  useEffect(() => {
    const el = indicatorRef.current;
    if (!el) return;

    const toX = activeIndex * 100;

    if (isInitialRender.current) {
      el.style.transform = `translateX(${toX}%)`;
      isInitialRender.current = false;
      prevIndexRef.current = activeIndex;
      return;
    }

    const fromX = prevIndexRef.current * 100;

    animationRef.current?.cancel();

    animationRef.current = el.animate(
      [
        { transform: `translateX(${fromX}%)` },
        { transform: `translateX(${toX}%)` },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
        fill: "forwards",
      }
    );

    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  return (
    <LiquidContainer
      radius="9999px"
      className={cn("h-8 w-[156px] p-1 shadow-none shrink-0", className)}
    >
      <div className="relative flex h-full w-full items-center select-none">
        <div
          ref={indicatorRef}
          style={{ width: `${segmentWidth}%` }}
          className={cn(
            "absolute top-0 bottom-0 left-0 rounded-full will-change-transform",
            "bg-gradient-to-b from-emerald-100/90 via-emerald-300/60 to-emerald-500/50",
            "border border-emerald-500/20 shadow-[0_2px_6px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.8)]",

            "dark:bg-gradient-to-b dark:from-emerald-400/25 dark:via-emerald-800/40 dark:to-emerald-950/75",
            "dark:border-emerald-400/25 dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(16,185,129,0.2)]"
          )}
        />

        {options.map((option, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(idx)}
              style={{ width: `${segmentWidth}%` }}
              className={cn(
                "relative z-10 h-full inline-flex items-center justify-center text-[11px] transition-colors duration-200 cursor-pointer rounded-full outline-none",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-foreground/45 hover:text-foreground/75 font-medium"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </LiquidContainer>
  );
}

export default function PrivacySection() {
  const user = useUser();

  const userData = useQuery(
    api.users.getUserData,
    user?._id ? { userId: user._id } : "skip"
  );

  const updatePrivacy = useMutation(api.users.updatePrivacySettings);

  if (!user) return null;

  const setPreference = (field: string, value: boolean) => {
    updatePrivacy({
      userId: user._id,
      [field]: value,
    });
  };

  return (
    <div className="space-y-2">
      <div className="pb-1 border-b border-foreground/10">
        <h2 className="text-sm font-semibold text-foreground">Privacy</h2>
      </div>

      <div className="flex flex-col divide-y divide-foreground/5 pt-0.5">
        <div className="flex items-center justify-between py-2.5 px-1">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Online status
          </span>
          <SlidingSegment
            options={["Visible", "Hidden"]}
            activeIndex={userData?.showOnlineStatus !== false ? 0 : 1}
            onChange={(idx) => setPreference("showOnlineStatus", idx === 0)}
          />
        </div>

        <div className="flex items-center justify-between py-2.5 px-1">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Now playing activity
          </span>
          <SlidingSegment
            options={["Broadcast", "Private"]}
            activeIndex={userData?.showCurrentTrack !== false ? 0 : 1}
            onChange={(idx) => setPreference("showCurrentTrack", idx === 0)}
          />
        </div>

        <div className="flex items-center justify-between py-2.5 px-1">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Public playlists
          </span>
          <SlidingSegment
            options={["Public", "Hidden"]}
            activeIndex={userData?.showPlaylists !== false ? 0 : 1}
            onChange={(idx) => setPreference("showPlaylists", idx === 0)}
          />
        </div>

        <div className="flex items-center justify-between py-2.5 px-1">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Liked songs
          </span>
          <SlidingSegment
            options={["Shared", "Private"]}
            activeIndex={userData?.showLikedSongs === true ? 0 : 1}
            onChange={(idx) => setPreference("showLikedSongs", idx === 0)}
          />
        </div>

        <div className="flex items-center justify-between py-2.5 px-1">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Room join link
          </span>
          <SlidingSegment
            options={["Allow", "Disabled"]}
            activeIndex={userData?.showActiveRoom !== false ? 0 : 1}
            onChange={(idx) => setPreference("showActiveRoom", idx === 0)}
          />
        </div>
      </div>
    </div>
  );
}