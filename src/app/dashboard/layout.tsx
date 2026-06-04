"use client";

import { Home, Search, Library, Heart, Users, Play, SkipForward, SkipBack, Volume2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Search", href: "/dashboard/search", icon: Search },
    { name: "Library", href: "/dashboard/library", icon: Library },
  ];

  return (
    <div className="flex h-screen bg-[#fcfcfc] font-sans overflow-hidden">
      
      <aside className="w-64 bg-neutral-100/50 border-r border-neutral-200/60 flex flex-col justify-between hidden md:flex">
        
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2 mb-10">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 select-none">Echo ♪</h1>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                  pathname === item.href 
                    ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/50" 
                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50"
                )}
              >
                <item.icon size={18} strokeWidth={2.5} />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-10">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Your Music</p>
            <nav className="space-y-1">
              <Link href="/dashboard/liked" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50 transition-all">
                <Heart size={18} strokeWidth={2.5} />
                Liked Songs
              </Link>
              <Link href="/dashboard/rooms" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/50 transition-all">
                <Users size={18} strokeWidth={2.5} />
                Live Rooms
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-200/60">
          <Link href="/api/auth/logout" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-neutral-500 hover:text-rose-600 hover:bg-rose-50 transition-all">
            Sign Out
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative h-[calc(100vh-90px)] overflow-y-auto">
        {children}
      </main>

      <div className="fixed bottom-0 left-0 w-full h-[90px] bg-white/80 backdrop-blur-2xl border-t border-neutral-200/60 flex items-center justify-between px-6 z-50">
        
        <div className="flex items-center gap-4 w-1/3">
          <div className="w-14 h-14 bg-neutral-200 rounded-lg overflow-hidden shadow-sm">
             <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" alt="Cover" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">We fell in love in october</h4>
            <p className="text-xs font-medium text-neutral-500">girl in red</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center w-1/3 gap-2">
          <div className="flex items-center gap-6">
            <button className="text-neutral-400 hover:text-neutral-900 transition-colors"><SkipBack size={20} fill="currentColor" /></button>
            <button className="w-10 h-10 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md">
              <Play size={18} fill="currentColor" className="ml-1" />
            </button>
            <button className="text-neutral-400 hover:text-neutral-900 transition-colors"><SkipForward size={20} fill="currentColor" /></button>
          </div>
          <div className="w-full max-w-md flex items-center gap-3">
            <span className="text-[10px] font-bold text-neutral-400">0:00</span>
            <div className="h-1.5 flex-1 bg-neutral-200 rounded-full overflow-hidden cursor-pointer">
              <div className="h-full bg-neutral-900 w-1/3 rounded-full" />
            </div>
            <span className="text-[10px] font-bold text-neutral-400">3:04</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/3">
          <button className="text-neutral-400 hover:text-neutral-900"><Volume2 size={18} /></button>
          <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden cursor-pointer">
            <div className="h-full bg-neutral-400 w-2/3 rounded-full" />
          </div>
        </div>

      </div>
    </div>
  );
}