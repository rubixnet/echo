"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Radio, Clock, ListPlus, Pin, Music2, Disc, Mic2, ListMusic, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiquidDrop } from "@/components/LiquidUI/LiquidDrop";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const user = useUser();

    const playlists = useQuery(api.playlists?.getUserPlaylists, user?._id ? { userId: user._id } : "skip");

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 hidden md:flex left-4 z-[900] w-8 h-8 rounded-lg bg-background/80 backdrop-blur-md border border-foreground/10 items-center justify-center text-foreground/60 hover:text-foreground shadow-sm transition-colors"
            >
                <ListMusic size={16} />
            </button>
        );
    }

    const NavItem = ({ href, icon: Icon, label }: { href: string, icon: any, label: string }) => {
        return (
            <Link href={href} className={cn("flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-xs font-medium",  "text-foreground/70 hover:bg-foreground/5 hover:text-foreground")}>
                <Icon size={14} strokeWidth={2} />
                <span className="truncate">{label}</span>
            </Link>
        );
    };

    return (
        <div className="fixed hidden md:block top-4 left-4 bottom-[80px] w-56 z-[900] pointer-events-auto">
            <LiquidDrop radius="16px" className="w-full h-full overflow-hidden flex flex-col">

                <div className="flex items-center justify-between px-4 py-3 shrink-0">
                    <span className="text-xs font-bold tracking-tight text-foreground">Menu</span>
                    <button onClick={() => setIsOpen(false)} className="text-foreground/40 hover:text-foreground transition-colors">
                        <X size={14} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto liquid-scroll px-2 py-4 flex flex-col gap-6">

                    <div className="flex flex-col gap-0.5">
                        <NavItem href="/dashboard" icon={Home} label="Home" />
                        <NavItem href="/dashboard/search" icon={Search} label="Search" />
                        <NavItem href="/dashboard/live" icon={Radio} label="Live Rooms" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between px-3 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Library</span>
                            <button className="text-[10px] font-bold text-foreground/50 hover:text-foreground transition-colors">Edit</button>
                        </div>
                        <NavItem href="/dashboard/history" icon={Clock} label="Recently Played" />
                        <NavItem href="/dashboard/added" icon={ListPlus} label="Recently Added" />
                        <NavItem href="/dashboard/pins" icon={Pin} label="Pins" />
                        <NavItem href="/dashboard/songs" icon={Music2} label="Songs" />
                        <NavItem href="/dashboard/albums" icon={Disc} label="Albums" />
                        <NavItem href="/dashboard/artists" icon={Mic2} label="Artists" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between px-3 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">Playlists</span>
                            <button className="text-[10px] font-bold text-foreground/50 hover:text-foreground transition-colors">Edit</button>
                        </div>
                        <NavItem href="/dashboard/playlists" icon={ListMusic} label="All Playlists" />
                        <NavItem href="/dashboard/liked" icon={Heart} label="Favorite Songs" />

                        <div className="mt-2 flex flex-col gap-0.5">
                            {playlists?.map(p => (
                                <Link
                                    key={p._id}
                                    href={`/dashboard/playlist/${p._id}`}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-medium truncate transition-colors", "text-foreground/70 hover:bg-foreground/5 hover:text-foreground")}
                                >
                                    {p.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </LiquidDrop>
        </div>
    );
}