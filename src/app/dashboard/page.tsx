import { Plus, Play } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8 md:p-12 pb-32">
      
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 mb-1">
            Good evening
            </h1>
          <p className="text-neutral-500 font-medium">Ready to sync up?</p>
        </div>
      </header>

      <section className="mb-12">
        <div className="bg-emerald-900 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative shadow-2xl shadow-neutral-900/10">
          
          <div className="absolute -right-20 -top-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Sessions
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Start a Listening Room</h2>
            <p className="text-neutral-400 font-medium max-w-md">
              Create a unique link. Invite your friends. Everyone listens to the exact same beat, at the exact same time.
            </p>
          </div>
          
          <button className="relative z-10 shrink-0 flex items-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} strokeWidth={3} />
            Create Room.! 
          </button>
        </div>
      </section>  

       <section>
        <h3 className="text-xl font-extrabold text-neutral-900 mb-6">Heavy Rotation</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          
          <div className="group cursor-pointer">
            <div className="relative aspect-square bg-neutral-200 rounded-2xl mb-4 overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop" alt="Album" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <button className="w-12 h-12 bg-emerald-400 text-neutral-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                  <Play size={20} fill="currentColor" className="ml-1" />
                </button>
              </div>
            </div>
            <h4 className="font-bold text-neutral-900 truncate">If I could make it go quiet</h4>
            <p className="text-sm font-medium text-neutral-500 truncate">girl in red</p>
          </div>

          <div className="group cursor-pointer">
            <div className="relative aspect-square bg-neutral-200 rounded-2xl mb-4 overflow-hidden shadow-sm">
              <img src="https://images.unsplash.com/photo-1493225457124-a1a2a5956093?q=80&w=400&auto=format&fit=crop" alt="Playlist" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <button className="w-12 h-12 bg-emerald-400 text-neutral-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                  <Play size={20} fill="currentColor" className="ml-1" />
                </button>
              </div>  
            </div>
            <h4 className="font-bold text-neutral-900 truncate">Late Night Drive</h4>
            <p className="text-sm font-medium text-neutral-500 truncate">Your Playlist</p>
          </div>

        </div>
      </section>

    </div>
  );
}