import { AudioProvider } from "@/components/AudioProvider";
import { UserProvider } from "@/hooks/useUser";
import GlobalPlayer from "@/components/GlobalPlayer/GlobalPlayer";
import Sidebar from "@/components/Sidebar";
// import Navbar from "@/components/Navbar/Navbar";
import Navbar from "@/components/MainNavbar";

export default function ClientLayout({ children, user }: { children: React.ReactNode; user: any; }) {
  return (
    <UserProvider user={user}>
      <AudioProvider>
        <DashboardShell user={user}>{children}</DashboardShell>
      </AudioProvider>
    </UserProvider>
  );
}

function DashboardShell({ children, user }: { children: React.ReactNode; user: any; }) {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans overflow-hidden text-neutral-900">
      <div className="flex flex-1 overflow-hidden relative">
        {/* <Navbar />  */}x
        {/* <Sidebar /> */}
        <Navbar />

        <main className="flex-1 overflow-y-auto relative z-10 pb-32 md:pt-24">
          {children}
        </main>
        
        <GlobalPlayer user={user} />
      </div>
    </div>
  );
}