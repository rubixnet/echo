"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Search,
  Library,
  Radio,
  type IconProps,
} from "@/components/icons";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const isSearchRoute = pathname.includes("/dashboard/search");

  const isLibraryRoute = pathname === "/dashboard/library";

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/search") return false;
    return pathname.startsWith(href);
  };

  return (
    <div className="relative w-full px-6 pt-2 flex items-center justify-center pointer-events-auto">
      <div className="absolute left-12 top-2 flex items-center">
        <LiquidContainer className="w-full h-11 animate-in fade-in zoom-in-95 duration-300 shadow-none">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="w-11 h-11 p-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-full"
            title="Go back"
          >
            <ChevronLeft size={22} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.forward()}
            className="w-11 h-11 p-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10 rounded-full"
            title="Go forward"
          >
            <ChevronRight size={22} />
          </Button>
        </LiquidContainer>
      </div>


      <div className="w-full max-w-100 px-4 flex justify-center">
        {isSearchRoute ? (
          <GlobalSearchBar />
        ) : isLibraryRoute ? null : (
          <LiquidContainer
            radius="50px"
            className="w-full h-11 px-1 animate-in fade-in zoom-in-95 duration-300 shadow-none"
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
        )}
      </div>
    </div>
  );
}