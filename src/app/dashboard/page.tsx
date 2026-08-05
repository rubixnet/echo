"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, Music, Play } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface Category {
  _id: string;
  categoryId: string;
  name: string;
  playlistId: string;
  type: "chart" | "genre" | string;
  coverUrl?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const categories = useQuery(api.syncPlaylists.getCategories);

  const handleNavigate = (id: string) => {
    router.push(`/dashboard/${id}`);
  };

  if (categories === undefined) {
    return <DashboardSkeleton />;
  }

  const charts = categories.filter((item) => item.type === "chart");
  const genres = categories.filter((item) => item.type === "genre");

  return (
    <div className="px-6 lg:px-12 py-10 space-y-12 bg-background text-foreground max-w-7xl mx-auto pb-32">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <TrendingUp size={18} />
          <h2 className="text-xl font-bold tracking-tight">Top Charts</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {charts.map((item) => (
            <PlaylistCard
              key={item._id}
              category={item}
              onClick={() => handleNavigate(item.categoryId)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Music size={18} />
          <h2 className="text-xl font-bold tracking-tight">
            Genres & Radio Feeds
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {genres.map((item) => (
            <PlaylistCard
              key={item._id}
              category={item}
              onClick={() => handleNavigate(item.categoryId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlaylistCard({
  category,
  onClick,
}: {
  category: Category;
  onClick: () => void;
}) {
  const fallbackImage =
    category.type === "chart"
      ? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300"
      : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300";

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-md hover:border-foreground/10 transition-colors"
    >
      <div className="relative select-none aspect-square w-full rounded-md overflow-hidden bg-foreground/5 shadow-sm mb-3">
        <img
          src={category.coverUrl || fallbackImage}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="font-bold text-sm text-foreground truncate">
        {category.name}
      </h3>
      <p className="text-xs font-medium text-foreground/50 mt-0.5 capitalize">
        {category.type === "chart" ? "Official Chart" : "Genre Playlist"}
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="px-6 lg:px-12 py-10 space-y-12 bg-background text-foreground max-w-7xl mx-auto pb-32">
      <section className="space-y-4">
        <div className="h-7 w-36 bg-foreground/10 rounded-md animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="h-7 w-48 bg-foreground/10 rounded-md animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <PlaylistCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlaylistCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-square w-full rounded-md bg-foreground/10 animate-pulse" />
      <div className="h-4 w-3/4 bg-foreground/10 rounded-sm animate-pulse" />
      <div className="h-3 w-1/2 bg-foreground/10 rounded-sm animate-pulse" />
    </div>
  );
}