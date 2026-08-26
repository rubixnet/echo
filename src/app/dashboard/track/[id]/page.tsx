"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

interface PlayableTrack {
  id: string;
  title: string;
  artist: string;
  uploaderName?: string;
  thumbnail: string;
  coverUrl?: string;
  duration: number | string;
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { playTrack } = useGlobalPlayback();

  const [track, setTrack] = useState<PlayableTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTrack() {
      try {
        setLoading(true);
        const res = await fetch(`/api/youtube/track/${id}`);
        if (!res.ok) throw new Error("Could not find track");

        const data = await res.json();
        if (isMounted) setTrack(data);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : "Error loading track");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) loadTrack();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePlay = () => {
    if (track) {
      playTrack(track);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-neutral-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading track...
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="p-8 text-center text-red-400">
        {error || "Track not found."}
      </div>
    );
  }  

  return (
    <div className="flex flex-col items-center md:items-start gap-6 p-8 max-w-3xl mx-auto text-primary">
      <div className="flex flex-col md:flex-row items-center gap-6 w-full">
        <div className="relative w-48 h-48 rounded-xl overflow-hidden shadow-lg bg-neutral-900 shrink-0">
          <Image
            src={track.thumbnail}
            alt={track.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex flex-col items-center md:items-start gap-2 overflow-hidden w-full text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold truncate w-full">
            {track.title}
          </h1>
          <p className="text-neutral-400 font-medium">
            {track.artist}
          </p>

          <Button
            className="mt-4 rounded-full px-6"
            onClick={handlePlay}
          >
            <Play size={18} fill="currentColor" className="mr-2" />
            Play
          </Button>
        </div>
      </div>
    </div>
  );
}