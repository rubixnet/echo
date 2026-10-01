"use client";

import { useState } from "react";
import { Track } from "@/components/TrackComponent";
import { DEMO_SONGS, type DemoSong } from "@/lib/demoSongs";
import type { TrackLike } from "@/components/PlaylistLayout";

function toTrack(song: DemoSong): TrackLike {
  return {
    _id: song.id,
    id: song.id,
    trackId: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration,
    coverUrl: song.coverUrl,
    source: { type: "demo", name: "Demo Songs" },
  };
}

export function DemoSongsSection() {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-foreground/80">
        <h2 className="text-xl font-bold tracking-tight">Demo Songs</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 lg:grid-cols-6">
        {DEMO_SONGS.map((song, i) => (
          <Track
            key={song.id}
            track={toTrack(song)}
            index={i + 1}
            variant="grid"
            loadingId={loadingId}
            setLoadingId={setLoadingId}
          />
        ))}
      </div>
    </section>
  );
}