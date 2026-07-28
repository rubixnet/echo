import { AudioProvider } from "@/components/AudioProvider";
import { UserProvider } from "@/hooks/useUser";
import GlobalPlayer from "@/components/GlobalPlayer/GlobalPlayer";
import Sidebar from "@/components/Sidebar";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Navbar from "@/components/Navbar/Navbar";

export default function ClientLayout({ children, user }: { children: React.ReactNode; user: any; }) {
  return (
    <UserProvider user={user}>
      <ConvexClientProvider>

        <AudioProvider>
          <DashboardShell user={user}>{children}</DashboardShell>
        </AudioProvider>
      </ConvexClientProvider>
    </UserProvider>
  );
}

function DashboardShell({ children, user }: { children: React.ReactNode; user: any; }) {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden text-neutral-900">
      <div className="flex flex-1 overflow-hidden relative">
        <Navbar />
        <Sidebar />

        <main className="flex-1 overflow-y-auto relative z-10 pb-32 md:pt-24">
          {children}
        </main>

        <GlobalPlayer user={user} />
      </div>
    </div>
  );
}