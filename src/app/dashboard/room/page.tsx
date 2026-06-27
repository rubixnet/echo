"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Radio, Users, Music, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function LiveRoomsPage() {
  const liveRooms = useQuery(api.rooms.getPublicRooms);

  if (liveRooms === undefined) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Live Jams</h2>
          <p className="text-sm text-neutral-500 font-medium">Discover active listening sessions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((placeholder) => (
            <div key={placeholder} className="h-48 bg-neutral-100 rounded-2xl animate-pulse border border-neutral-200/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Live Rooms</h2>
          </div>
        </div>
      </div>

      {liveRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 squircle p-16 text-center max-w-xl mx-auto mt-12 bg-white/50 backdrop-blur-sm shadow-sm">
          <div className="w-12 h-12 squircle bg-neutral-100 flex items-center justify-center text-neutral-400 mb-4">
            <Radio size={22} />
          </div>
          <h3 className="text-base font-bold text-neutral-900">The airwaves are quiet</h3>
          <p className="text-xs font-medium text-neutral-500 mt-1 max-w-xs">No public live sessions are broadcasting right now. Use the sidebar panel to launch your own studio workspace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveRooms.map((room) => (
            <Card key={room._id} className="bg-white border-neutral-200/60 shadow-sm  hover:shadow-md transition-all rounded-2xl overflow-hidden group flex flex-col justify-between">
              <CardHeader className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base font-bold text-neutral-900 truncate tracking-tight pr-2">
                      {room.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                      Host ID: <span className="font-mono truncate max-w-[80px]">{room.hostId}</span>
                    </CardDescription>
                  </div>

                  {room.isPlaying ? (
                    <span className="flex h-2.5 w-2.5 relative shrink-0 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 shrink-0 mt-1" title="Paused" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 pt-0 flex-1">
                <div className="bg-neutral-50 border border-neutral-200/50 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center shrink-0 text-neutral-500 shadow-inner">
                    <Music size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-0.5">Now Playing</p>
                    <p className="text-xs font-bold text-neutral-800 truncate">
                      {room.isPlaying ? "Active Broadcast Stream" : "Playback Paused"}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-neutral-50/50 border-t border-neutral-100 p-4 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-1.5 text-neutral-500 text-xs font-bold">
                  <Users size={14} className="text-neutral-400" />
                  <span>{room.listeners?.length || 1} tuning in</span>
                </div>

                <Link
                  href={`/dashboard/room/${room._id}`}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "h-8 rounded-lg text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm transition-all flex items-center gap-1 group-hover:translate-x-0.5"
                  )}
                >
                  Tune In <ArrowRight size={12} strokeWidth={2.5} />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}