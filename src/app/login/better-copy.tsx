"use client";

import { Music, ArrowRight} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-[#fcfcfc] font-sans selection:bg-emerald-200 selection:text-emerald-900">
      
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative z-10">
        
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 lg:left-32">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner group-hover:scale-105 transition-transform">
              <Music size={18} className="ml-0.5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900">Echo ♪</h1>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto mt-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-2">
            Welcome in.
          </h2>
          <p className="text-neutral-500 font-medium mb-10">
            Sign in or create an account to start syncing. We'll show you around once you're inside.
          </p>

          <div className="space-y-4">
            <button className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full flex items-center justify-center gap-3 bg-white")}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full flex items-center justify-center gap-3 bg-white")}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#fcfcfc] px-4 text-xs font-bold uppercase tracking-widest text-neutral-400">Or</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="w-full h-14 px-6 rounded-full bg-neutral-100 border-2 border-transparent focus:bg-white focus:border-neutral-200 focus:ring-4 focus:ring-neutral-900/5 outline-none transition-all font-medium text-neutral-900 placeholder:text-neutral-400"
                  required
                />
              </div>
              <button 
                type="submit" 
                className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full group")}
              >
                Continue with Email
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </form>
          </div>
          
          <p className="mt-8 text-center text-xs font-medium text-neutral-400">
            By continuing, you agree to our <Link href="#" className="underline hover:text-neutral-900">Terms of Service</Link> and <Link href="#" className="underline hover:text-neutral-900">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative bg-neutral-100 items-center justify-center p-12 overflow-hidden">
        
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-200/50 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-100/60 rounded-full blur-[100px] -z-10 mix-blend-multiply" />
      </div>
    </div>
  );
}