"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Music, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHARTS, GENRES, Category } from "@/lib/yt-charts";

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState<Category>(CHARTS[0]);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchPlaylist() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/youtube/playlist?playlistId=${activeCategory.playlistId}`);
        const data = await res.json();
        setTracks(data.tracks || []);
      } catch (err) {
        console.error("Failed to fetch playlist via yt-dlp:", err);
        setTracks([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylist();
  }, [activeCategory.playlistId]);

  return (
    <section className="relative p-4 max-w-6xl mx-auto space-y-8 pb-32 text-foreground antialiased z-40">
      
      
    </section>
  );
}