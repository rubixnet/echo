"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Library, Radio, Settings } from "lucide-react";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { cn } from "@/lib/utils";

export default function MobileNavbar() {
    const pathname = usePathname();

    const NavItem = ({ href, icon: Icon, active }: { href: string; icon: any; active?: boolean }) => (
        <Link 
            href={href} 
            className={cn(
                "relative flex items-center justify-center h-full flex-1 transition-colors duration-300",
                active ? "text-primary" : "text-foreground/50 hover:text-foreground"
            )}
        >
            <div className={cn(
                "absolute m-auto h-11 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] rounded-full z-0",
                active ? "bg-foreground/5 w-[calc(100%+4px)] opacity-100 scale-100" : "w-10 opacity-0 scale-50" 
            )} />
            
            <Icon 
                size={active ? 22 : 20} 
                strokeWidth={active ? 2.5 : 2} 
                className="relative z-10 transition-all duration-300" 
            />
        </Link>
    );

    return (
        <div className="pb-4.5 mx-3 max-w-md w-full,  items-center">
            <LiquidContainer radius="50px" className="w-full h-14 shadow-xl animate-in slide-in-from-bottom-10 fade-in duration-500">
                <div className="w-full h-full flex items-center justify-between px-2">
                    <NavItem href="/dashboard" icon={Home} active={pathname === "/dashboard"} />
                    <NavItem href="/dashboard/search" icon={Search} active={pathname.includes("/dashboard/search")} />
                    <NavItem href="/dashboard/library" icon={Library} active={pathname.includes("/library")} />
                    <NavItem href="/dashboard/rooms" icon={Radio} active={pathname.includes("/profile")} />
                    <NavItem href="/dashboard/settings" icon={Settings} active={pathname.includes("/settings")} />
                </div>
            </LiquidContainer>  
            
        </div>
    );
}