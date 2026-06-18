"use client";

import { useState, useEffect, useRef } from "react";
import {
  Home, Search, Library, Users, Play, Pause,
  SkipForward, SkipBack, Volume2, VolumeX, LogOut, PanelLeftClose, PanelLeftOpen,
  Radio, Plus, X, Link2, Music, Check, Shield, Loader2, Heart, MoreHorizontal, ListPlus, PlusCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AudioProvider, useAudioEngine } from "@/components/AudioProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserProvider } from "@/hooks/useUser";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClientLayout({ children, user }: { children: React.ReactNode; user: any; }) {
  return (
    <UserProvider user={user}>
      <AudioProvider>
        <DashboardShell user={user}>{children}</DashboardShell>
      </AudioProvider>
    </UserProvider>
  );
}


function DashboardShell({ children, user }: { children: React.ReactNode; user: any; }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    progressRef, isPlaying, isLoading, currentTimeStr, duration,
    currentTrackUrl, activeMetadata, togglePlay, seek, volume, setVolume
  } = useAudioEngine();

  const createRoom = useMutation(api.rooms.createRoom);
  const deleteRoom = useMutation(api.rooms.deleteRoom);
  const toggleLikeMutation = useMutation(api.tracks.toggleLike);

  const isLiked = useQuery(api.tracks.checkLiked, {
      userId: user?._id,
      trackId: activeMetadata?.id
  });

  const [activeRoom, setActiveRoom] = useState<{ id: string; name: string; listenerCount: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Global Vault", href: "/dashboard/search", icon: Search },
    { name: "My Library", href: "/dashboard/library", icon: Library },
  ];


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (activeRoom && user?._id) {
        deleteRoom({ roomId: activeRoom.id as any, userId: user._id }).catch(() => {});
      }
    };
  }, [activeRoom, user, deleteRoom]);

  const handleCreateRoom = async () => {
    if (!roomNameInput.trim()) return;
    try {
      const newRoomId = await createRoom({ name: roomNameInput, isPublic: true, userId: user._id });
      setActiveRoom({ id: newRoomId, name: roomNameInput, listenerCount: 1 });
      setIsCreating(false);
      setRoomNameInput("");
      router.push(`/dashboard/room/${newRoomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  const handleCloseRoom = async () => {
    if (activeRoom && user?._id) {
      try { await deleteRoom({ roomId: activeRoom.id as any, userId: user._id }); }
      catch (err) { console.error("Failed to delete room", err); }
    }
    setActiveRoom(null);
    router.push("/dashboard");
  };

  const handleCopyInvite = () => {
    if (!activeRoom) return;
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/room/${activeRoom.id}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleLike = async () => {
    if (!activeMetadata?.id || !user?._id) return;
    try {
        await toggleLikeMutation({
            userId: user._id,
            trackId: activeMetadata.id as any,
            title: activeMetadata.title,
            artist: activeMetadata.artist,
            coverUrl: activeMetadata.coverUrl,
            duration: duration,
            audioUrl: currentTrackUrl || ""
        });
    } catch (e) {
        console.error("Failed to like track", e);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#FAFAFA] font-sans overflow-hidden selection:bg-emerald-200 selection:text-emerald-900 text-neutral-900">
      <div className="flex flex-1 overflow-hidden relative">

        <aside className={cn(
          "bg-white/60 backdrop-blur-xl border-r border-neutral-200/50 flex flex-col justify-between hidden md:flex transition-all duration-300 ease-in-out shrink-0 z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.02)]",
          isCollapsed ? "w-20" : "w-64"
        )}>
          <div className="flex flex-col h-full">
            <div className={cn("h-[88px] flex items-center px-3.5 border-b border-neutral-100/50", isCollapsed ? "justify-center px-0" : "justify-between")}>
              {!isCollapsed && (
                <Link href="/dashboard" className="flex items-center gap-3 group">
                  <h1 className="font-black tracking-tight text-neutral-950 text-xl select-none">Echo ♪</h1>
                </Link>
              )}
              <button
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.name} href={item.href} className={cn(
                      "flex items-center rounded-xl text-sm font-bold transition-all h-11",
                      isCollapsed ? "justify-center px-0" : "gap-3 px-4",
                      isActive
                        ? "bg-white text-neutral-950 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-neutral-200/60"
                        : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50"
                    )}>
                      <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn("shrink-0", isActive && "text-emerald-600")} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </nav>

              <div>
                {!isCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Community</p>}
                <nav className="space-y-1">
                  <Link href="/dashboard/room" className={cn(
                    "flex items-center rounded-xl text-sm font-bold transition-all h-11",
                    isCollapsed ? "justify-center px-0" : "gap-3 px-4",
                    pathname === "/dashboard/rooms"
                      ? "bg-white text-neutral-950 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-neutral-200/60"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/50"
                  )}>
                    <Users size={18} strokeWidth={pathname === "/dashboard/room" ? 2.5 : 2} className="shrink-0" />
                    {!isCollapsed && <span>Live Rooms</span>}
                  </Link>
                </nav>
              </div>

              <div className="space-y-3">
                {!isCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Broadcast</p>}

                {activeRoom ? (
                  <div className={cn(
                    "bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 text-white rounded-2xl p-4 relative overflow-hidden shadow-xl shadow-neutral-900/10",
                    isCollapsed && "p-2 flex flex-col items-center"
                  )}>
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                    {!isCollapsed ? (
                      <>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mb-2">
                          <Radio size={12} className="animate-pulse" /> Live
                        </div>
                        <h4 className="text-sm font-bold truncate pr-4 text-white leading-tight">{activeRoom.name}</h4>
                        <p className="text-xs text-neutral-400 font-medium mb-4 mt-1 flex items-center gap-1.5">
                          <Users size={12} /> {activeRoom.listenerCount} Tuned In
                        </p>

                        <div className="flex items-center gap-2">
                          <Button variant="secondary" onClick={handleCopyInvite} className="h-8 text-xs font-bold rounded-xl flex-1 bg-white/10 hover:bg-white/20 text-white border-0 shadow-none">
                            {shareCopied ? <Check size={14} className="text-emerald-400" /> : <Link2 size={14} />}
                            {shareCopied ? "Copied" : "Share"}
                          </Button>
                          <Button variant="destructive" size="icon" onClick={handleCloseRoom} className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border-0 shadow-none">
                            <X size={14} />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button variant="destructive" size="icon" onClick={handleCloseRoom} className="h-10 w-10 rounded-xl bg-neutral-800 text-rose-400 hover:bg-rose-500 hover:text-white border-0 shadow-none">
                        <Radio size={18} className="animate-pulse" />
                      </Button>
                    )}
                  </div>
                ) : isCreating ? (
                  <div className="bg-white border border-neutral-200/80 rounded-2xl p-3 space-y-3 shadow-sm">
                    <input
                      type="text"
                      placeholder="Name your channel..."
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      className="w-full text-sm font-medium px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5 transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <Button onClick={handleCreateRoom} className="h-9 text-xs font-bold flex-1 bg-neutral-950 text-white hover:bg-neutral-800 rounded-xl shadow-md">
                        Start Session
                      </Button>
                      <Button variant="ghost" onClick={() => setIsCreating(false)} className="h-9 w-9 p-0 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100">
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsCreating(true)}
                    variant="outline"
                    className={cn(
                      "w-full h-11  border-neutral-100 text-neutral-500 hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-100/50 rounded-xl text-sm font-bold shadow-none transition-all",
                      isCollapsed ? "p-0 justify-center" : "gap-2 px-4 justify-start"
                    )}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    {!isCollapsed && <span>Create Channel</span>}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100/50 bg-white/30 backdrop-blur-sm">
              <div className={cn("flex items-center", isCollapsed ? "flex-col gap-4 justify-center" : "justify-between")}>
                <div className={cn("flex items-center", isCollapsed ? "justify-center" : "gap-3")}>
                  <Avatar className="h-10 w-10 border border-neutral-100">
                    <AvatarImage src={user?.picture || user?.profilePictureUrl || user?.image} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-emerald-50 font-black text-sm">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-sm font-bold text-neutral-950 truncate">{user?.email?.split('@')[0] || "Guest"}</span>
                    </div>
                  )}
                </div>
                <Link
                  href="/api/auth/logout"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  )}
                >
                  <LogOut size={16} />
                </Link>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative pb-32">
          {children}
        </main>
      </div>

      <div className="absolute bottom-0 left-0 md:left-64 right-0 px-4 md:px-8 pb-4 md:pb-6 z-50 pointer-events-none transition-all duration-300">
        <div className="h-[88px] w-full bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl flex items-center justify-between px-4 md:px-6 pointer-events-auto">

          <div className="flex items-center gap-4 w-1/4 md:w-1/3 min-w-0">
            {activeMetadata ? (
              <>
                <div className="w-14 h-14 bg-neutral-100 border border-neutral-200/50 rounded-2xl overflow-hidden shadow-sm shrink-0 relative group">
                  <img src={activeMetadata.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="hidden sm:flex items-center min-w-0 pr-4">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-neutral-950 truncate tracking-tight">{activeMetadata.title}</h4>
                    <p className="text-xs font-medium text-neutral-500 truncate mt-0.5">{activeMetadata.artist}</p>
                  </div>
                  <button 
                    onClick={handleLike}
                    className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
                  >
                    <Heart size={18} className={cn("transition-colors", isLiked ? "text-emerald-500 fill-emerald-500" : "text-neutral-400 hover:text-neutral-900")} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 text-neutral-400">
                <div className="w-14 h-14 bg-neutral-50 border border-neutral-100/80 rounded-2xl flex items-center justify-center shrink-0">
                  <Music size={20} className="text-neutral-300" />
                </div>
                <div className="hidden sm:block">
                  <h4 className="text-sm font-bold text-neutral-400 tracking-tight">Audio Engine Ready</h4>
                  <p className="text-xs font-medium text-neutral-300 mt-0.5">Select a track to begin</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center w-2/4 md:w-1/3 gap-2.5">
            <div className="flex items-center gap-5 md:gap-8">
              <button className="text-neutral-400 hover:text-neutral-900 hover:scale-110 active:scale-95 transition-all">
                <SkipBack size={20} fill="currentColor" />
              </button>

              <button
                onClick={togglePlay}
                disabled={!currentTrackUrl}
                className="w-12 h-12 bg-neutral-950 text-white rounded-full flex items-center justify-center hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-1" />
                )}
              </button>

              <button className="text-neutral-400 hover:text-neutral-900 hover:scale-110 active:scale-95 transition-all">
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>

            <div className="w-full max-w-[400px] flex items-center gap-3 group">
              <span className="text-[10px] font-bold text-neutral-400 w-9 text-right font-mono tracking-tighter">
                {currentTimeStr}
              </span>

              <div
                onClick={seek}
                className="h-1.5 flex-1 bg-neutral-100 border border-neutral-200/50 rounded-full overflow-hidden cursor-pointer relative group-hover:h-2 transition-all shadow-inner"
              >
                <div
                  ref={progressRef}
                  className="absolute top-0 left-0 h-full bg-neutral-950 rounded-full w-0 pointer-events-none"
                />
              </div>

              <span className="text-[10px] font-bold text-neutral-400 w-9 text-left font-mono tracking-tighter">
                {duration}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 w-1/4 md:w-1/3">
            {activeRoom && (
              <div className="hidden lg:flex items-center gap-1.5 mr-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Shield size={12} className="text-emerald-500" /> Sync Active
              </div>
            )}
            
            <div className="hidden sm:flex items-center gap-2.5 group">
              <button
                onClick={() => setVolume && setVolume(volume === 0 ? 0.8 : 0)}
                className="text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range" min="0" max="1" step="0.01"
                value={volume !== undefined ? volume : 0.8}
                onChange={(e) => setVolume && setVolume(parseFloat(e.target.value))}
                className="w-16 md:w-20 h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-950 opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </div>

            <div className="relative ml-2" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>

              {isMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-48 bg-white border border-neutral-200/60 rounded-2xl shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors">
                    <ListPlus size={16} /> Add to Playlist
                  </button>
                  <button className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50 transition-colors">
                    <PlusCircle size={16} /> Create Playlist
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}