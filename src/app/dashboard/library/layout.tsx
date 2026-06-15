"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: "Liked Songs", href: "/dashboard/library/liked" },
    { name: "Playlists", href: "/dashboard/library/playlists" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tighter text-neutral-900">Your Library</h1>
      </div>

      <div className="flex gap-6 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button 
            key={tab.name}
            onClick={() => router.push(tab.href)}
            className={cn(
              "pb-3 text-sm font-bold transition-all border-b-2",
              pathname === tab.href 
                ? "text-emerald-600 border-emerald-600" 
                : "text-neutral-400 border-transparent hover:text-neutral-900"
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="pt-2 animate-in fade-in duration-300">
        {children}
      </div>
    </div>
  );
}