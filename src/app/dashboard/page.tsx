"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, Music, Play } from "lucide-react";
import { Playlists, Category } from "@/lib/yt-charts";

export default function DashboardPage() {
  const router = useRouter();

  const charts = Playlists.filter((item) => item.type === "chart");
  const genres = Playlists.filter((item) => item.type === "genre");

  const handleNavigate = (id: string) => {
    router.push(`/dashboard/${id}`);
  };

  return (
    <div className="px-6 lg:px-12 py-10 space-y-12 bg-background text-foreground max-w-7xl mx-auto pb-32">
      
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <TrendingUp size={18} />
          <h2 className="text-xl font-bold tracking-tight">Top Charts</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {charts.map((item) => (
            <PlaylistCard key={item.id} category={item} onClick={() => handleNavigate(item.id)} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Music size={18} />
          <h2 className="text-xl font-bold tracking-tight">Genres & Radio Feeds</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {genres.map((item) => (
            <PlaylistCard key={item.id} category={item} onClick={() => handleNavigate(item.id)} />
          ))}
        </div>
      </section>

    </div>
  );
}

function PlaylistCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const fallbackImage =
    category.type === "chart"
      ? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300"
      : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300";

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
    >
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-foreground/5 shadow-sm mb-3">
        <img
          src={category.coverNode || fallbackImage}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform">
            <Play size={18} className="fill-current ml-0.5" />
          </div>
        </div>
      </div>

      <h3 className="font-bold text-sm text-foreground truncate">{category.name}</h3>
      <p className="text-xs font-medium text-foreground/50 mt-0.5 capitalize">
        {category.type === "chart" ? "Official Chart" : "Genre Playlist"}
      </p>
    </div>
  );
}