"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Library, Radio, Settings, Sun, Moon } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { GlobalSearchBar } from "../GlobalSearchBar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2.5} className="shrink-0" />
      ) : (
        <Moon size={18} strokeWidth={2.5} className="shrink-0" />
      )}
    </button>
  );
}

export default function DesktopNavbar() {
  const pathname = usePathname();
  const isSearchPage = pathname.includes("/dashboard/search");

  const NavItem = ({
    href,
    icon: Icon,
    active,
    label,
  }: {
    href: string;
    icon: any;
    active?: boolean;
    label: string;
  }) => (
    <Link
      href={href}
      className={cn(
        "h-9 flex items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? "bg-foreground/10 text-primary w-full"
          : "text-foreground/60 hover:text-foreground hover:bg-foreground/5 w-full"
      )}
      aria-label={label}
    >
      <Icon size={18} strokeWidth={2.5} className="shrink-0" />
    </Link>
  );

  return (
    <div className="w-full max-w-100 mx-auto px-4 pt-2 flex justify-center pointer-events-auto transition-all duration-500">
      {isSearchPage ? (
        <div className="w-full">
          <GlobalSearchBar />
        </div>
      ) : (
        <LiquidContainer
          radius="50px"
          className="w-full h-11 px-1 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="w-full h-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <NavItem
                href="/dashboard"
                icon={Home}
                label="Home"
                active={pathname === "/dashboard"}
              />
              <NavItem
                href="/dashboard/search"
                icon={Search}
                label="Search"
              />
              <NavItem
                href="/dashboard/library"
                icon={Library}
                label="Library"
                active={pathname.includes("/library")}
              />
              <NavItem
                href="/dashboard/rooms"
                icon={Radio}
                label="Profile"
                active={pathname.includes("/rooms")}
              />
              <NavItem
                href="/dashboard/settings"
                icon={Settings}
                label="Settings"
                active={pathname.includes("/settings")}
              />
            </div>

            <ThemeToggle />
          </div>
        </LiquidContainer>
      )}
    </div>
  );
}