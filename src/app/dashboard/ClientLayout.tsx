"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AudioProvider } from "@/components/providers/AudioProvider";
import type { AppUser } from "@/hooks/useUser";
import { UserProvider } from "@/hooks/useUser";
import { RoomProvider } from "@/hooks/useRoomContext";
import GlobalPlayer from "@/components/GlobalPlayer/GlobalPlayer";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar/Navbar";
import { useHeartbeat } from "@/hooks/useHeartbeat";

export default function ClientLayout({
  children,
  user,
  initialSidebarOpen,
}: {
  children: React.ReactNode;
  user: AppUser;
  initialSidebarOpen?: boolean;
}) {
  useHeartbeat(user?._id);

  return (
    <UserProvider user={user}>
      <AudioProvider>
        <RoomProvider>
          <DashboardShell initialSidebarOpen={initialSidebarOpen}>
            {children}
          </DashboardShell>
        </RoomProvider>
      </AudioProvider>
    </UserProvider>
  );
}

function DashboardShell({
  children,
  initialSidebarOpen,
}: {
  children: React.ReactNode;
  initialSidebarOpen?: boolean;
}) {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden text-neutral-900">
      <div className="flex flex-1 overflow-hidden relative">
        <ScrollToTop />
        <Navbar />
        <Sidebar initialOpen={initialSidebarOpen} />

        <main className="flex-1 overflow-y-auto relative z-10 pb-32 md:pt-24">
          {children}
        </main>

        <GlobalPlayer />
      </div>
    </div>
  );
}

function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}