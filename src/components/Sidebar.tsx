"use client";

import Image from "next/image";
import { useSyncExternalStore, useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Radio,
  Pin,
  ListMusic,
  Star,
  X,
  MicVocal,
  History,
  User,
  Music,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidDrop } from "@/components/LiquidUI/LiquidDrop";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";

function subscribeToSidebarState(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("sidebar-toggle", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("sidebar-toggle", onChange);
  };
}

function getSidebarSnapshot() {
  if (typeof window === "undefined") return "true";
  return localStorage.getItem("sidebar-open") ?? "true";
}

export function useSidebar(initialOpen?: boolean) {
  const isOpen =
    useSyncExternalStore(
      subscribeToSidebarState,
      getSidebarSnapshot,
      () => (initialOpen !== undefined ? String(initialOpen) : "true"),
    ) === "true";

  const toggleSidebar = (state: boolean) => {
    localStorage.setItem("sidebar-open", String(state));
    document.cookie = `sidebar-open=${state}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  return { isOpen, toggleSidebar };
}

interface SidebarProps {
  initialOpen?: boolean;
}

export default function Sidebar({ initialOpen }: SidebarProps) {
  const { isOpen, toggleSidebar } = useSidebar(initialOpen);
  const [isPinsOpen, setIsPinsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = useUser();
  const playlists = useQuery(
    api.playlists?.getUserPlaylists,
    user?._id ? { userId: user._id } : "skip",
  );

  const pinnedPlaylists = playlists?.filter((p) => p.isPinned);

  function handleChevronClick() {
    setIsPinsOpen(!isPinsOpen);
  }

  return (
    <>
      <Button
        onClick={() => toggleSidebar(true)}
        className={cn(
          "fixed top-3 left-4 z-900 w-11 h-11 rounded-full backdrop-blur-md border border-foreground/10 items-center justify-center text-foreground/85 hover:text-primary shadow-sm p-0",
          !mounted && "transition-none",
          isOpen ? "hidden" : "hidden md:flex",
        )}
      >
        <ListMusic size={16} />
      </Button>

      <aside
        className={cn(
          "fixed lg:static top-3 left-4 bottom-20 w-56 z-900 pointer-events-auto",
          !mounted && "transition-none",
          isOpen ? "hidden md:block" : "hidden",
        )}
      >
        <LiquidDrop
          radius="16px"
          className="w-full h-full lg:rounded-tr-[25px] lg:rounded-tl-none overflow-hidden lg:-mt-0.5 lg:-ml-0.5 flex flex-col"
        >
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-bold tracking-tight text-foreground"></span>
            <button
              onClick={() => toggleSidebar(false)}
              className="text-foreground/40 px-4 py-3 lg:pb-1 lg:mt-1.5 hover:text-primary transition-colors cursor-pointer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden px-2 py-2 flex flex-col gap-6">
            <div className="shrink-0 flex flex-col gap-0.5">
              <NavItem href="/dashboard" icon={Home} label="Home" />
              <NavItem href="/dashboard/search" icon={Search} label="Search" />
              <NavItem href="/dashboard/rooms" icon={Radio} label="Live Rooms" />
              <NavItem href="/dashboard/settings" icon={User} label="Profile" />
            </div>

            <div className="shrink-0 flex flex-col gap-0.5">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">
                  Library
                </span>
              </div>

              <div className="flex items-center text-foreground/85 group rounded-md hover:bg-foreground/5 hover:text-primary">
                <Link
                  href="/dashboard/library#pins"
                  className="flex items-center w-full gap-3 px-3 py-1.5 transition-colors text-xs font-medium"
                >
                  <Pin size={18} strokeWidth={2} />
                  <span className="truncate">Pins</span>
                </Link>
                <button
                  onClick={handleChevronClick}
                  className="text-foreground/50 w-12 h-7 flex justify-center rounded-r-lg items-center hover:text-foreground group-hover:bg-foreground/5 cursor-pointer"
                >
                  {isPinsOpen ? (
                    <ChevronUp size={20} strokeWidth={2.5} />
                  ) : (
                    <ChevronDown size={20} strokeWidth={2.5} />
                  )}
                </button>
              </div>
              {isPinsOpen && (
                <div className="flex-1 overflow-y-auto liquid-scroll flex flex-col gap-0.5 ml-2 mr-2 pb-1">
                  <div className="flex-1 flex flex-col gap-0.5 min-h-0">
                    {pinnedPlaylists?.map((p) => (
                      <SidebarPlaylistItem key={p._id} playlist={p} />
                    ))}
                  </div>
                </div>
              )}

              <NavItem
                href="/dashboard/library/history"
                label="Recently Played"
                icon={History}
              />
              <NavItem
                icon={Music}
                href="/dashboard/library#songs"
                label="Songs"
              />
              <NavItem
                icon={MicVocal}
                href="/dashboard/library#artists"
                label="Artists"
              />
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

              <div className="flex-1 overflow-y-auto liquid-scroll flex flex-col gap-0.5 pr-1 pb-4">
                {playlists?.map((p) => (
                  <SidebarPlaylistItem key={p._id} playlist={p} />
                ))}
              </div>
            </div>
          </div>
        </LiquidDrop>
      </aside>
    </>
  );
}

type PlaylistSummary = Doc<"playlists"> & { coverUrl?: string | null };

function SidebarPlaylistItem({ playlist }: { playlist: PlaylistSummary }) {
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
        "flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors text-foreground/70 hover:bg-foreground/5 hover:text-primary",
      )}
    >
      <div className="w-5 h-5 shrink-0 rounded-[4px] bg-foreground/5 border border-foreground/10 flex items-center justify-center overflow-hidden shadow-sm">
        {coverUrl ? (
          <Image
            width={500}
            height={500}
            unoptimized
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

function NavItem({
  href,
  icon: Icon,
  visual,
  label,
}: {
  href: string;
  icon?: LucideIcon;
  visual?: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-xs font-medium",
        "text-foreground/85 hover:bg-foreground/5 hover:text-primary",
      )}
    >
      {visual ? visual : Icon && <Icon size={18} strokeWidth={2} />}
      <span className="truncate">{label}</span>
    </Link>
  );
}