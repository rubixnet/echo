"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import {
  ChevronDown,
} from "@/components/icons";
import {
  LogOut,
  Moon,
  Sun,
  Laptop,
} from "lucide-react";

export default function SettingsHeader() {
  const user = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const userData = useQuery(
    api.users.getUserData,
    user?._id ? { userId: user._id } : "skip"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const username = userData?.username || userData?.name || "username";

  return (
    <div className="flex items-center justify-between pb-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight capitalize text-foreground truncate">
            {username}
          </h1>
          <p className="text-xs text-foreground/50">{userData?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 px-3 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/10 border border-foreground/10 rounded-xl gap-2"
            >
              {!mounted ? (
                <span className="h-3.5 w-3.5" />
              ) : theme === "dark" ? (
                <Moon size={14} className="text-primary" />
              ) : theme === "light" ? (
                <Sun size={14} className="text-primary" />
              ) : (
                <Laptop size={14} className="text-primary" />
              )}
              <span className="capitalize">
                {mounted ? theme || "system" : "system"}
              </span>
              <ChevronDown size={12} className="opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl shadow-none">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="cursor-pointer text-xs"
            >
              <Sun size={13} className="mr-2 opacity-70" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="cursor-pointer text-xs"
            >
              <Moon size={13} className="mr-2 opacity-70" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="cursor-pointer text-xs"
            >
              <Laptop size={13} className="mr-2 opacity-70" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="sm"
          asChild
          className="h-9 w-9 p-0 text-foreground/70 hover:text-foreground hover:bg-foreground/10 border border-foreground/10 rounded-xl"
          title="Log out"
        >
          <a href="/api/auth/logout">
            <LogOut size={15} />
          </a>
        </Button>
      </div>
    </div>
  );
}