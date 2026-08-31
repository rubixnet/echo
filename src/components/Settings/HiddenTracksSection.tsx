"use client";

import { useUser } from "@/hooks/useUser";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Music,
} from "@/components/icons";
import {
  Trash,
} from "lucide-react";
import Image from "next/image"

type HatedTrack =
  | string
  | {
    trackId?: string;
    _id?: string;
    name?: string;
    title?: string;
    artist?: string;
    coverUrl?: string;
  };

export default function HiddenTracksSection() {
  const user = useUser();

  const hatedTrackIds = useQuery(
    api.neverShowAgain.getUserHatedTracks,
    user?._id ? { userId: user._id } : "skip"
  );

  const removeFromNeverShowAgainTracks = useMutation(
    api.neverShowAgain.removeFromNeverShowAgainTracks
  );

  if (!user) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Hidden Tracks</h2>
        {hatedTrackIds && hatedTrackIds.length > 0 && (
          <span className="text-xs text-foreground/40 font-mono">
            {hatedTrackIds.length} hidden
          </span>
        )}
      </div>

      {hatedTrackIds === undefined ? (
        <div className="space-y-1.5">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 bg-foreground/10 rounded-xl animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-1/3 bg-foreground/10 rounded-lg animate-pulse" />
                <div className="h-2.5 w-1/5 bg-foreground/10 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>

      ) : hatedTrackIds.length === 0 ? (
        <div className="py-8 text-center border-t border-foreground/10">
          <p className="text-xs font-medium text-foreground/60">No hidden tracks</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5 border-t border-foreground/10 pt-1">
          {hatedTrackIds.map((track: HatedTrack) => {
            const isString = typeof track === "string";
            const trackId = isString ? track : track.trackId || track._id || "";
            const songName = isString
              ? "Unknown Song"
              : track.name || track.title || "Unknown Song";
            const artistName = isString
              ? "Hidden Artist"
              : track.artist || "Hidden Artist";
            const coverUrl = isString ? null : track.coverUrl;

            return (
              <div
                key={trackId}
                className="group flex items-center justify-between p-2 rounded-xl hover:bg-foreground/[0.04] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-card border border-foreground/10 overflow-hidden flex items-center justify-center">
                    {coverUrl ? (
                      <Image
                        width={36}
                        height={36}
                        unoptimized
                        src={coverUrl}
                        alt={songName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-4 h-4 text-foreground/40" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {songName}
                    </span>
                    <span className="text-[11px] text-foreground/60 truncate mt-0.5">
                      {artistName}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromNeverShowAgainTracks({ userId: user._id, trackId })}
                  title="Remove from hidden list"
                  className="h-8 w-8 p-0 text-foreground/40 hover:text-foreground hover:bg-foreground/10 rounded-xl transition-colors shrink-0"
                >
                  <Trash size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}