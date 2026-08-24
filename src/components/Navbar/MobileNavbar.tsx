"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Library, Radio, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { cn } from "@/lib/utils";

function NavItem({
  href,
  icon: Icon,
  active,
}: {
  href: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center justify-center h-full flex-1 transition-colors duration-300",
        active
          ? "text-primary font-bold"
          : "text-foreground/80 hover:text-foreground",
      )}
    >
      <div
        className={cn(
          "absolute m-auto h-11 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-full z-0",
          active
            ? "bg-foreground/5 w-[calc(100%+4px)] opacity-100 scale-100"
            : "w-10 opacity-0 scale-50",
        )}
      />

      <Icon
        size={active ? 22 : 20}
        strokeWidth={active ? 3 : 2}
        className="relative z-10 transition-all duration-300"
      />
    </Link>
  );
}

export default function MobileNavbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center pb-4 px-3 z-50 pointer-events-none">
      <div className="max-w-md w-full pointer-events-auto">
        <LiquidContainer
          radius="50px"
          className="w-full h-14 animate-in slide-in-from-bottom-10 fade-in duration-500"
        >
          <div className="w-full h-full flex items-center justify-between px-2">
            <NavItem
              href="/dashboard"
              icon={Home}
              active={pathname === "/dashboard"}
            />
            <NavItem
              href="/dashboard/search"
              icon={Search}
              active={pathname.includes("/dashboard/search")}
            />
            <NavItem
              href="/dashboard/library"
              icon={Library}
              active={pathname.includes("/library")}
            />
            <NavItem
              href="/dashboard/rooms"
              icon={Radio}
              active={pathname.includes("/profile")}
            />
            <NavItem
              href="/dashboard/settings"
              icon={Settings}
              active={pathname.includes("/settings")}
            />
          </div>
        </LiquidContainer>
      </div>
    </div>
  );
}
