"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Library, Radio, Settings, Bell } from "lucide-react";
import { GlobalSearchBar } from "../GlobalSearchBar";
import { cn } from "@/lib/utils";

export default function DesktopNavbar() {
  const pathname = usePathname();
  const isSearchPage = pathname.includes("/dashboard/search");

  const NavItem = ({ href, icon: Icon, active, label }: { href: string; icon: any; active?: boolean, label: string }) => (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative z-10 flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors duration-200 active:scale-[0.98]",
        active
          ? "bg-white/20 text-white shadow-sm"
          : "text-zinc-200 hover:text-white hover:bg-white/15"
      )}
    >
      <Icon size={20} strokeWidth={2.5} className={cn("drop-shadow-sm", active && "drop-shadow-md")} />
    </Link>
  );

  return (
    <div className="w-full max-w-[500px] mx-auto px-4 pt-4 flex items-center justify-center gap-3 pointer-events-auto">

      <div className="flex-1 w-full max-w-md">
        {isSearchPage ? (
          <div className="w-full">
            <GlobalSearchBar />
          </div>
        ) : (
          <div className="relative w-full p-2 shadow-2xl flex items-center gap-1 rounded-[16px]">

            <div className="relative z-10 w-full flex items-center justify-between gap-1">
              <NavItem href="/dashboard" icon={Home} label="Home" active={pathname === "/dashboard"} />
              <NavItem href="/dashboard/search" icon={Search} label="Search" />
              <NavItem href="/dashboard/library" icon={Library} label="Library" active={pathname.includes("/library")} />
              <NavItem href="/dashboard/rooms" icon={Radio} label="Profile" active={pathname.includes("/rooms")} />
              <NavItem href="/dashboard/settings" icon={Settings} label="Settings" active={pathname.includes("/settings")} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}   