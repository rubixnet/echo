"use client";

import { useState, useEffect } from "react";
import {
  Home, Search, Library, Users, LogOut, PanelLeftClose, PanelLeftOpen,
  Radio, Plus, X, Link2, Check
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AudioProvider } from "@/components/AudioProvider";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserProvider } from "@/hooks/useUser";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GlobalPlayer from "@/components/GlobalPlayerUI";

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

  const keepRoomAlive = useMutation(api.rooms.keepRoomAlive);
  const createRoom = useMutation(api.rooms.createRoom);

  const [activeRoom, setActiveRoom] = useState<{ id: string; name: string; listenerCount: number } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Global Vault", href: "/dashboard/search", icon: Search },
    { name: "My Library", href: "/dashboard/library", icon: Library },
  ];

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
                    {!isCollapsed && <span>Create Live Room</span>}
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
                <a
                  href="/api/auth/logout"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  )}
                >
                  <LogOut size={16} />
                </a>              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative pb-32">
          {children}
        </main>

        <GlobalPlayer user={user} />

      </div>
    </div>
  );
}