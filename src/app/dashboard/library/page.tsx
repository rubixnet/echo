"use client";

import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useUser } from "@/hooks/useUser"
import { Heart, Music, ListMusic, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function LibraryPage() {
  const user = useUser()

  const likedSongs = useQuery(api.likes.getMyLikes, user?._id ? { userId: user._id } : "skip");
  const playlists = useQuery(api.playlists.getUserPlaylists, user?._id ? { userId: user._id } : "skip")

  return (
    <div className="p-6 md:p-10 mx-auto max-w-7xl space-y-12 pb-32 text-neutral-900 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/40 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-natural-950 mb-1">Your Library</h1>
          <p className="text-sm font-medium text-neutral-400">All your saved songs and collections</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/library/liked"
          className="group relative h-48 md:h-64 col-span-1 md:col-span-2 lg:col-span-1 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 group-hover:scale-105 transition-transform duration-700 ease-out" />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 text-white">
            <Heart size={32} className="mb-4 fill-white text-white drop-shadow-md" />
            <h2 className="text-2xl font-black tracking-tight drop-shadow-sm">Liked Songs</h2>
            <p className="text-white/80 font-medium text-sm mt-1 flex items-center gap-2">
              {likedSongs === undefined ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                `${likedSongs.length} saved tracks`
              )}
            </p>
          </div>
        </Link>

        {playlists === undefined ? (
          <div className="h-48 md:h-64 rounded-3xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-neutral-300" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="h-48 md:h-64 rounded-3xl bg-neutral-50 border border-dashed border-neutral-200 flex flex-col items-center justify-center text-center p-6 col-span-1 md:col-span-2">
            <ListMusic size={32} className="text-neutral-300 mb-3" />
            <h3 className="font-bold text-neutral-700">No playlists yet</h3>
            <p className="text-xs text-neutral-400 font-medium mt-1">Create one from the global player.</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <Link
              key={playlist._id}
              href={`/dashboard/library/playlist/${playlist._id}`}
              className="group h-48 md:h-64 bg-white border border-neutral-200/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Music size={24} className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 tracking-tight line-clamp-1">{playlist.name}</h3>
                  <p className="text-xs font-medium text-neutral-400 mt-1 uppercase tracking-widest">Collection</p>
                </div>
                <div className="w-8 h-8 bg-neutral-50 rounded-full flex items-center justify-center group-hover:bg-neutral-900 group-hover:text-white transition-colors text-neutral-400">
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}