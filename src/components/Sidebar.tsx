"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Radio,
  ListPlus,
  Pin,
  ListMusic,
  Star,
  X,
  Bookmark,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidDrop } from "@/components/LiquidUI/LiquidDrop";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const user = useUser();
  const playlists = useQuery(
    api.playlists?.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip",
  );

  useEffect(() => {
    setIsMounted(true);
    const savedState = localStorage.getItem("sidebar-open");
    if (savedState !== null) {
      setIsOpen(savedState === "true");
    }
  }, []);

  const toggleSidebar = (state: boolean) => {
    setIsOpen(state);
    localStorage.setItem("sidebar-open", String(state));
  };

  if (!isMounted)
    return (
      <div className="fixed hidden md:block top-3 left-4 bottom-20 w-56 z-900" />
    );

  if (!isOpen) {
    return (
      <Button
        onClick={() => toggleSidebar(true)}
        className="fixed top-3 hidden md:flex left-4 z-900 w-11 h-11 rounded-full backdrop-blur-md border border-foreground/10 items-center justify-center text-foreground/60 hover:text-foreground shadow-sm transition-colors p-0"
      >
        <ListMusic size={16} />
      </Button>
    );
  }

  const NavItem = ({
    href,
    icon: Icon,
    visual,
    label,
  }: {
    href: string;
    icon?: any;
    visual?: React.ReactNode;
    label: string;
  }) => {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-xs font-medium",
          "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
        )}
      >
        {visual ? visual : Icon && <Icon size={18} strokeWidth={2} />}
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed lg:static hidden md:block top-3 left-4 bottom-20 w-56 z-900 pointer-events-auto">
      <LiquidDrop
        radius="16px"
        className="w-full h-full overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between shrink-0">
          <span className="text-xs font-bold tracking-tight text-foreground"></span>
          <button
            onClick={() => toggleSidebar(false)}
            className="text-foreground/40 px-4 py-3 hover:text-foreground transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden px-2 py-2 flex flex-col gap-6">
          <div className="shrink-0 flex flex-col gap-0.5">
            <NavItem href="/dashboard" icon={Home} label="Home" />
            <NavItem href="/dashboard/search" icon={Search} label="Search" />
            <NavItem href="/dashboard/rooms" icon={Radio} label="Live Rooms" />
          </div>

          <div className="shrink-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                Library
              </span>
              <button className="text-[10px] font-bold text-foreground/50 hover:text-foreground transition-colors">
                Edit
              </button>
            </div>

            <NavItem
              href="/dashboard/library/history"
              label="Recently Played"
              visual={
                <div className="w-5 h-5 shrink-0 rounded-[4px] bg-radial-[at_top_left] from-cyan-400 via-teal-700 to-slate-950 flex items-center justify-center shadow-sm">
                  <History size={12} className="text-white" />
                </div>
              }
            />
            <NavItem
              href="/dashboard/library#added"
              icon={Bookmark}
              label="Recently Saved"
            />

            <NavItem href="/dashboard/library#pins" icon={Pin} label="Pins" />
          </div>

          <div className="flex-1 flex flex-col gap-0.5 min-h-0">
            <div className="shrink-0 flex items-center justify-between px-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                Playlists
              </span>
            </div>

            <div className="shrink-0">
              <NavItem
                href="/dashboard/library"
                icon={ListMusic}
                label="All Playlists"
              />

              <NavItem
                href="/dashboard/library/liked"
                label="Favorite Songs"
                visual={
                  <div className="w-5 h-5 shrink-0 rounded-[4px] bg-gradient-to-br from-rose-500 via-fuchsia-600 to-indigo-800 flex items-center justify-center shadow-sm">
                    <Star size={12} className="fill-white text-white" />
                  </div>
                }
              />
            </div>

            <div className="flex-1 overflow-y-auto liquid-scroll flex flex-col gap-0.5 pr-1 pb-4 scrollbar-thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-foreground/10 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
              {playlists?.map((p) => (
                <SidebarPlaylistItem key={p._id} playlist={p} />
              ))}
            </div>
          </div>
        </div>
      </LiquidDrop>
    </div>
  );
}

function SidebarPlaylistItem({ playlist }: { playlist: any }) {
  const tracks = useQuery(api.playlists.getPlaylistTracks, {
    playlistId: playlist._id,
  });

  const coverUrl =
    playlist.coverUrl ||
    (tracks && tracks.length > 0 ? tracks[0]?.coverUrl : null);

  return (
    <Link
      href={`/dashboard/library/playlist/${playlist._id}`}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      <div className="w-5 h-5 shrink-0 rounded-[4px] bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden shadow-sm">
        {coverUrl ? (
          <img
            src={coverUrl}
            className="w-full h-full object-cover"
            alt={playlist.name}
          />
        ) : (
          <ListMusic size={12} className="text-foreground/30" />
        )}
      </div>
      <span className="truncate capitalize">{playlist.name}</span>
    </Link>
  );
}
