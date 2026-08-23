import { AudioProvider } from "@/components/AudioProvider";
import type { AppUser } from "@/hooks/useUser";
import { UserProvider } from "@/hooks/useUser";
import { RoomProvider } from "@/hooks/useRoomContext";
import GlobalPlayer from "@/components/GlobalPlayer/GlobalPlayer";
import Sidebar from "@/components/Sidebar";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Navbar from "@/components/Navbar/Navbar";

export default function ClientLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AppUser;
}) {
  return (
    <UserProvider user={user}>
      <ConvexClientProvider>
        <AudioProvider>
          {/* Room core: live membership + playback sync for EVERY page. */}
          <RoomProvider>
            <DashboardShell>{children}</DashboardShell>
          </RoomProvider>
        </AudioProvider>
      </ConvexClientProvider>
    </UserProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden text-neutral-900">
      <div className="flex flex-1 overflow-hidden relative">
        <Navbar />
        <Sidebar />

        <main className="flex-1 overflow-y-auto relative z-10 pb-32 md:pt-24">
          {children}
        </main>

        <GlobalPlayer />
      </div>
    </div>
  );
}
