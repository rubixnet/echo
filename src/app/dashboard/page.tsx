"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { useAudioEngine } from "@/components/AudioProvider";
import { useUser } from "@/hooks/useUser";
import { Plus, Play, Pause, Radio, Music, Sparkles, ArrowUpRight, Disc, Loader2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGlobalPlayback } from "@/hooks/useGlobalPlayback";

export default function DashboardPage() {
  const user = useUser();
  const router = useRouter();

  const { currentTrackUrl, isPlaying } = useAudioEngine();
  const { playTrack } = useGlobalPlayback();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const trendingTracks = useQuery(api.tracks.search, { searchQuery: "" });
  const liveRooms = useQuery(api.rooms.getPublicRooms);
  const createRoom = useMutation(api.rooms.createRoom);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLaunchStudio = async () => {
    if (!user?._id) return;
    try {
      const studioId = await createRoom({
        name: `${user.name?.split(' ')[0] || "Echo"}'s Studio Session`,
        isPublic: true,
        userId: user._id
      });
      router.push(`/dashboard/room/${studioId}`);
    } catch (e) {
      console.error("Studio deployment initialization failed:", e);
    }
  };



  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12 pb-32 text-neutral-900 selection:bg-emerald-200 selection:text-emerald-900 animate-in fade-in duration-500">

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/40 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-950 mb-1">
            {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ""}
          </h1>
          <p className="text-sm font-medium text-neutral-400">
            Welcome back to the studio workspace. Ready to calibrate your sound?
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white border border-neutral-200/60 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm flex flex-col justify-between group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-bl-full pointer-events-none transition-all duration-500 group-hover:scale-110" />

          <div className="space-y-4 max-w-md relative z-10">
            <h2 className="text-2xl md:text-3xl font-black text-neutral-950 tracking-tight leading-none">
              Broadcast Studio Workspace
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 font-medium leading-relaxed">
              Start streaming songs with your friends and invite them to listen to the music at the same time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-8 relative z-10">
            <button
              onClick={handleLaunchStudio}
              className="flex items-center justify-center gap-2 bg-neutral-950 text-white px-6 h-12 rounded-xl font-bold shadow-sm hover:bg-neutral-800 active:scale-[0.98] transition-all text-xs"
            >
              <Plus size={16} strokeWidth={2.5} />
              Launch Active Channel
            </button>
            <Link
              href="/dashboard/rooms"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 px-6 rounded-xl font-bold text-xs text-neutral-600 hover:text-neutral-900 transition-all flex items-center justify-center gap-1.5"
              )}
            >
              Explore Live Channels <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black tracking-tight text-neutral-950">Heavy Rotation</h3>
          <div className="h-px flex-1 bg-neutral-200/60" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {trendingTracks === undefined ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="space-y-3 animate-pulse">
                <div className="aspect-square bg-neutral-100 border border-neutral-200/30 rounded-2xl w-full" />
                <div className="h-4 bg-neutral-100 rounded-md w-3/4" />
                <div className="h-3 bg-neutral-100 rounded-md w-1/2" />
              </div>
            ))
          ) : trendingTracks.length === 0 ? (
            <div className="col-span-full py-10 text-center border border-dashed border-neutral-200 rounded-2xl bg-white/40">
              <Music className="mx-auto text-neutral-300 mb-2" size={24} />
              <p className="text-xs font-bold text-neutral-400">No tracks initialized in storage vault.</p>
            </div>
          ) : (
            trendingTracks.map((track) => {
              const videoId = track.youtubeId || track.audioUrl?.split("id=")[1];
              const isLoading = loadingId === videoId;
              const isThisTrackPlaying = currentTrackUrl?.includes(videoId) && isPlaying;

              return (
                <div key={track._id} className="group cursor-pointer flex flex-col space-y-3">
                  <div
                    onClick={() => playTrack(track, setLoadingId)}
                    className="relative aspect-square bg-neutral-100 border border-neutral-200/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-neutral-300"
                  >
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />

                    <div className={cn(
                      "absolute inset-0 bg-neutral-950/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300",
                      isThisTrackPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <button className="w-11 h-11 bg-white text-neutral-950 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-95">
                        {isLoading ? (
                          <Loader2 size={18} className="animate-spin text-neutral-900" />
                        ) : isThisTrackPlaying ? (
                          <Pause size={16} fill="currentColor" />
                        ) : (
                          <Play size={16} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0 px-0.5">
                    <h4 className={cn(
                      "text-xs md:text-sm font-bold truncate tracking-tight transition-colors duration-200",
                      isThisTrackPlaying ? "text-emerald-600" : "text-neutral-900 group-hover:text-neutral-950"
                    )}>
                      {track.title}
                    </h4>
                    <p className="text-[11px] font-medium text-neutral-400 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}