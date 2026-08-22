"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Search,
  Library,
  Radio,
  Settings,
  LucideIcon,
} from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { GlobalSearchBar } from "../GlobalSearchBar";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/search", icon: Search, label: "Search" },
  { href: "/dashboard/library", icon: Library, label: "Library" },
  { href: "/dashboard/rooms", icon: Radio, label: "Rooms" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DesktopNavbar() {
  const pathname = usePathname();

  if (pathname.includes("/dashboard/search")) {
    return (
      <div className="w-full max-w-100 mx-auto px-4 pt-2 flex justify-center pointer-events-auto">
        <GlobalSearchBar />
      </div>
    );
  }

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/search") return false;
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full max-w-100 mx-auto px-4 pt-2 flex justify-center pointer-events-auto transition-all duration-500">
      <LiquidContainer
        radius="50px"
        className="w-full h-11 px-1 animate-in fade-in zoom-in-95 duration-300"
      >
        <nav className="w-full h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active = isItemActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className={cn(
                    "h-9 w-full flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active
                      ? "bg-foreground/10 text-primary"
                      : "text-foreground/60 hover:text-foreground hover:bg-foreground/5",
                  )}
                >
                  <Icon size={18} strokeWidth={2.5} className="shrink-0" />
                </Link>
              );
            })}
          </div>
        </nav>
      </LiquidContainer>
    </div>
  );
}
