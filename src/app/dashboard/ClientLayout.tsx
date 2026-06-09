"use client";
import { useState } from "react";
import {
  Home, Search, Library, Heart, Users, Play, Pause,
  SkipForward, SkipBack, Volume2, VolumeX, LogOut, PanelLeftClose, PanelLeftOpen,
  Radio, Plus, X, Link2, Check, Shield
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { useAudioEngine } from "@/hooks/audioPlayer";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ClientLayout({
  children,
  user
}: {
  children: React.ReactNode;
  user: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { progressRef, isPlaying, currentTimeStr, duration, togglePlay, seek, volume, setVolume } = useAudioEngine();
  const createRoom = useMutation(api.rooms.createRoom);
  const deleteRoom = useMutation(api.rooms.deleteRoom);


  const [activeRoom, setActiveRoom] = useState<{ id: string; name: string; listenerCount: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Library", href: "/dashboard/library", icon: Library },
    { name: "Search", href: "/dashboard/search", icon: Search },
  ];

  const handleCreateRoom = async () => {
    if (!roomNameInput.trim()) return;

    try {
      const newRoomId = await createRoom({
        name: roomNameInput,
        isPublic: true,
        userId: user._id
      });

      setActiveRoom({
        id: newRoomId,
        name: roomNameInput,
        listenerCount: 1
      });

      setIsCreating(false);
      setRoomNameInput("");

      router.push(`/dashboard/room/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleCloseRoom = async () => {
    if (activeRoom && user?._id) {
      try {
        await deleteRoom({
          roomId: activeRoom.id as any,
          userId: user._id
        });
      } catch (err) {
        console.error("Failed to delete room from database", err);
      }
    }
    
    setActiveRoom(null);
    router.push("/dashboard");
  };

  const handleCopyInvite = () => {
    if (!activeRoom) return;
    const inviteUrl = `${window.location.origin}/dashboard/room/${activeRoom.id}`;
    navigator.clipboard.writeText(inviteUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-neutral-50/50 font-sans overflow-hidden selection:bg-emerald-200 selection:text-emerald-900">
      <div className="flex flex-1 overflow-hidden">
        <aside className={cn("bg-neutral-50/80 border-r border-neutral-200/60 flex flex-col justify-between hidden md:flex transition-all duration-300 ease-in-out shrink-0 z-30", isCollapsed ? "w-20" : "w-64")}>
          <div className="flex flex-col h-full">

            <div className={cn("h-[90px] flex items-center px-4 border-b border-transparent", isCollapsed ? "justify-center" : "justify-between")}>
              {!isCollapsed && (
                <Link href="/dashboard" className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white font-black text-sm">E♪</div>
                  <h1 className="font-black tracking-tight text-neutral-900 text-xl select-none">Echo</h1>
                </Link>
              )}
              <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-900 hover:bg-white" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </Button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              <nav className="space-y-1.5">
                {navItems.map((item) => (
                  <Link key={item.name} href={item.href} className={cn("flex items-center rounded-xl text-sm font-bold transition-all h-10", isCollapsed ? "justify-center px-0" : "gap-3 px-3", pathname === item.href ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/50" : "text-neutral-500 hover:text-neutral-900 hover:bg-white/60")}>
                    <item.icon size={18} strokeWidth={pathname === item.href ? 2.5 : 2} className="shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </nav>

              <Separator className="bg-neutral-200/50" />

              <div>
                {!isCollapsed && <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Your Music</p>}
                <nav className="space-y-1.5">
                  <Link href="/dashboard/liked" className={cn("flex items-center rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-white/60 transition-all h-10", isCollapsed ? "justify-center" : "gap-3 px-3", pathname === "/dashboard/liked" && "bg-white text-neutral-900 shadow-sm border border-neutral-200/50")}>
                    <Heart size={18} strokeWidth={pathname === "/dashboard/liked" ? 2.5 : 2} className="shrink-0" />
                    {!isCollapsed && <span>Liked Songs</span>}
                  </Link>
                  <Link href="/dashboard/room" className={cn("flex items-center rounded-xl text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-white/60 transition-all h-10", isCollapsed ? "justify-center" : "gap-3 px-3", pathname === "/dashboard/rooms" && "bg-white text-neutral-900 shadow-sm border border-neutral-200/50")}>
                    <Users size={18} strokeWidth={pathname === "/dashboard/room" ? 2.5 : 2} className="shrink-0" />
                    {!isCollapsed && <span>Live Rooms</span>}
                  </Link>
                </nav>
              </div>

              <Separator className="bg-neutral-200/50" />

              <div className="space-y-2">
                {!isCollapsed && <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Live Sync Jam</p>}

                {activeRoom ? (
                  <div className={cn("bg-neutral-900 text-white rounded-2xl p-4 relative overflow-hidden shadow-md", isCollapsed && "p-2 flex flex-col items-center")}>
                    <div className="absolute -right-8 -top-8 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                    {!isCollapsed ? (
                      <>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider mb-1">
                          <Radio size={12} className="animate-pulse" /> Live Now
                        </div>
                        <h4 className="text-xs font-bold truncate pr-4">{activeRoom.name}</h4>
                        <p className="text-[10px] text-neutral-400 font-medium mb-3">{activeRoom.listenerCount} listening together</p>

                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm" onClick={handleCopyInvite} className="h-7 text-[11px] font-bold rounded-lg flex-1 bg-white/10 hover:bg-white/20 text-white border-0">
                            {shareCopied ? <Check size={12} className="text-emerald-400" /> : <Link2 size={12} />}
                            {shareCopied ? "Copied" : "Share"}
                          </Button>
                          <Button variant="destructive" size="icon" onClick={handleCloseRoom} className="h-7 w-7 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border-0">
                            <X size={12} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button variant="destructive" size="icon" onClick={handleCloseRoom} className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white">
                        <Radio size={16} className="animate-pulse" />
                      </Button>
                    )}
                  </div>
                ) : isCreating ? (
                  <div className="bg-white border border-neutral-200 rounded-2xl p-3 space-y-2.5 shadow-sm">
                    <input type="text" placeholder="Room name..." value={roomNameInput} onChange={(e) => setRoomNameInput(e.target.value)} className="w-full text-xs font-medium px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-neutral-400 transition-colors" />
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" onClick={handleCreateRoom} className="h-7 text-[11px] font-bold flex-1 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg">Launch</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)} className="h-7 w-7 p-0 rounded-lg text-neutral-400 hover:text-neutral-900"><X size={14} /></Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setIsCreating(true)} variant="outline" className={cn("w-full h-10 border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:bg-white rounded-xl text-xs font-bold shadow-none", isCollapsed ? "p-0 justify-center" : "gap-2 px-3 justify-start")}>
                    <Plus size={16} strokeWidth={2.5} />
                    {!isCollapsed && <span>Create Live Room</span>}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200/60 bg-neutral-50/50">
              <div className={cn("flex items-center", isCollapsed ? "flex-col gap-4 justify-center" : "justify-between")}>
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                  <Avatar className="h-9 w-9 border border-neutral-200 shadow-sm">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{user?.email?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  {!isCollapsed && <div className="flex flex-col min-w-0 text-sm font-bold text-neutral-900 truncate">{user?.email?.split('@')[0] || "Unknown User"}</div>}
                </div>

                <Link
                  href="/api/auth/logout"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-8 w-8 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  )}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </Link>

              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative">
          <div className="h-full w-full">{children}</div>
        </main>
      </div>

      <div className="h-[90px] shrink-0 w-full bg-white/80 backdrop-blur-3xl border-t border-neutral-200/60 flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-3 md:gap-4 w-1/4 md:w-1/3">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-neutral-100 border border-neutral-200/50 rounded-xl overflow-hidden shadow-sm shrink-0">
            <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block min-w-0">
            <h4 className="text-sm font-bold text-neutral-900 truncate">Test Jam</h4>
            <p className="text-xs font-medium text-neutral-500 truncate">Audio Engine</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-2/4 md:w-1/3 gap-1.5 md:gap-2">
          <div className="flex items-center gap-4 md:gap-6">
            <button className="text-neutral-400 hover:text-neutral-900 transition-colors"><SkipBack size={18} fill="currentColor" /></button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 md:w-11 md:h-11 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-neutral-900/10"
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button className="text-neutral-400 hover:text-neutral-900 transition-colors"><SkipForward size={18} fill="currentColor" /></button>
          </div>

          <div className="w-full max-w-md flex items-center gap-2 md:gap-3 group">
            <span className="text-[10px] font-bold text-neutral-400 w-8 text-right font-mono">{currentTimeStr}</span>
            <div onClick={seek} className="h-1.5 flex-1 bg-neutral-200/80 rounded-full overflow-hidden cursor-pointer relative group-hover:h-2 transition-all">
              <div ref={progressRef} className="absolute top-0 left-0 h-full bg-neutral-900 rounded-full w-0 pointer-events-none" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400 w-8 text-left font-mono">{duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 md:gap-4 w-1/4 md:w-1/3">
          {activeRoom && (
            <div className="hidden lg:flex items-center gap-1.5 mr-4 px-2.5 py-1 bg-neutral-100 rounded-lg text-neutral-600 text-[11px] font-bold border border-neutral-200/50">
              <Shield size={12} className="text-emerald-500" /> Sync Active
            </div>
          )}

          <button onClick={() => setVolume && setVolume(volume === 0 ? 0.8 : 0)} className="text-neutral-400 hover:text-neutral-900 hidden sm:block">
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div className="w-16 md:w-24 hidden sm:flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume !== undefined ? volume : 0.8}
              onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}