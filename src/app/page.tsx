"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Homepage() {
  return (
    <div className="bg-[#fcfcfc] min-h-screen flex flex-col pt-24 selection:bg-emerald-200 selection:text-emerald-900 font-sans">
      
      <nav className="fixed top-0 left-0 z-50 w-full bg-[#fcfcfc]/70 backdrop-blur-2xl px-6 md:px-10 py-5 flex justify-between items-center transition-all duration-500">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Echo ♪</h1>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className={buttonVariants({ variant: "secondary" })}
          >
            login
          </Link>
          </div>
      </nav>

      <main className="relative w-full flex-1 flex flex-col justify-center min-h-[85vh] pb-20 px-6 md:px-10 max-w-screen-2xl mx-auto z-10">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-50/60 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center w-full max-w-7xl mx-auto">
          
          <div className="flex flex-col items-start text-left lg:col-span-7 xl:col-span-8">
            <h2 className="text-6xl md:text-[5rem] font-extrabold tracking-tighter leading-[1.05] mb-6 text-neutral-900">
              Music sounds better <br /> with your friends.
            </h2>
            <p className="text-lg md:text-xl text-neutral-500 font-medium tracking-tight mb-10 max-w-xl leading-relaxed">
              listen to same songs with your friends at the same time!
            </p>
            
            <Link 
              href="/login" 
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "group")}
            >
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center gap-8 relative lg:col-span-5 xl:col-span-4">
            
            <button 
              className="group relative flex items-center justify-center w-[260px] h-[260px] md:w-[320px] md:h-[320px] cursor-pointer focus:outline-none rounded-full"
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-sm z-10">
                <circle 
                  cx="50%" cy="50%" r="48%" 
                  stroke="rgba(0,0,0,0.03)" strokeWidth="4" fill="none" 
                />
                <circle 
                  cx="50%" cy="50%" r="48%" 
                  stroke="#34d399" 
                  strokeWidth="4" fill="none" 
                  pathLength="100" 
                  strokeLinecap="round"
                  className="transition-all duration-[250ms] ease-linear" 
                />
              </svg>

              <div className={`w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-full shadow-2xl shadow-neutral-300/40 overflow-hidden relative bg-neutral-100 transition-all duration-500`}> 
                <img 
                  src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop"
                  alt="Currently Playing" 
                  className="w-full h-full object-cover scale-110 pointer-events-none"
                />
                <div className="absolute inset-0 rounded-full border-[20px] border-black/5 mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 rounded-full border-[1px] border-white/20 inset-ring pointer-events-none" />
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#fcfcfc] rounded-full shadow-inner flex items-center justify-center border border-neutral-200/50 z-20">
                <div className="w-2 h-2 bg-neutral-300 rounded-full shadow-sm" />
             </div>
            </button>

            <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/60 shadow-xl shadow-neutral-200/40 rounded-3xl px-8 py-4 flex flex-col items-center text-center w-[90%]">
              <h4 className="font-bold text-neutral-900 text-lg leading-tight mb-0.5">We fell in love in october</h4>
              <p className="text-sm text-neutral-500 font-medium">girl in red</p>
            </div>

          </div>
        </div>
      </main>

      <footer className="w-full h-[40vh] md:h-[50vh] bg-neutral-100 flex items-end justify-center overflow-hidden border-t border-neutral-200/50 mt-auto">
        <h1 className="text-[35vw] md:text-[30vw] leading-[0.7] font-black tracking-tighter bg-gradient-to-b from-neutral-400 to-neutral-200 bg-clip-text text-transparent opacity-50 select-none translate-y-[15%]">
          echo!
        </h1>
      </footer>

    </div>
  );
}