"use client";

import { Zap, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Zap,
      title: "Millisecond Sync",
      desc: "Our custom engine calculates latency on the fly. When you press play, everyone hears the beat drop at the exact same moment.",
    },
    {
      icon: Globe2,
      title: "Global Stream",
      desc: "Don't want to host? Drop into the global stream to see what the rest of the world is feeling and listening to right now.",
    },
    {
      icon: Sparkles,
      title: "Premium Audio",
      desc: "We host our own high-fidelity audio tracks via our edge network. Zero buffering, no data tracking, just pure uninterrupted sound.",
    }  ];
    
    useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const onGoogleLogin = () => {
    const authUrl = new URL("/api/auth/google", window.location.origin);
    window.location.href = authUrl.toString();
  }

  return (
    <div className="flex min-h-screen bg-[#fcfcfc] font-sans">
      
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative z-10">
        
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 lg:left-32">
          <Link href="/" className="flex items-center gap-3 group">
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">Echo ♪</h1>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto mt-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-2">
            Welcome in.
          </h2>
          <p className="text-neutral-500 font-medium mb-10 leading-relaxed">
            Sign in or create an account to start syncing. We'll show you around once you're inside.
          </p>

          <div className="space-y-4">
            <button onClick={onGoogleLogin} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 h-14 rounded-full")}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-8 text-center text-xs font-medium text-neutral-400">
            By continuing, you agree to our <Link href="#" className="underline hover:text-neutral-900 transition-colors">Terms of Service</Link> and <Link href="#" className="underline hover:text-neutral-900 transition-colors">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-100 items-center justify-center p-12 overflow-hidden">
        
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-200/50 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-100/60 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
        
        <div className="relative w-full max-w-lg aspect-square">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] overflow-hidden flex flex-col">
            
            <div 
              className="flex-1 flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div key={index} className="min-w-full h-full flex flex-col justify-center px-12 pt-4 pb-16">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-neutral-100 flex items-center justify-center text-emerald-500 mb-8">
                    <slide.icon size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-neutral-900 mb-4">
                    {slide.title}
                  </h3>
                  <p className="text-neutral-500 font-medium leading-relaxed text-lg">
                    {slide.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="absolute bottom-12 left-12 flex gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={cn(
                    "h-2 rounded-full transition-all duration-500 ease-out",
                    currentSlide === index 
                      ? "w-8 bg-neutral-900" 
                      : "w-2 bg-neutral-300 hover:bg-neutral-400"
                  )}
                />
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}