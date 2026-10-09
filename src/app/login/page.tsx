"use client";

import { Zap, Globe2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState("");
  const [demoError, setDemoError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const demoSignInEnabled = process.env.NEXT_PUBLIC_LOCAL_DEMO_AUTH === "true";
  const googleSignInEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== "false";

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
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const onDemoLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDemoError(null);
    setIsSigningIn(true);
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        redirectTo?: string;
        error?: string;
      };
      if (!response.ok || !result.redirectTo) {
        throw new Error(result.error || "Could not start the demo account.");
      }
      window.location.assign(result.redirectTo);
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : "Sign-in failed.");
      setIsSigningIn(false);
    }
  };

  const onGoogleLogin = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const url = new URL("/api/auth/google?platform=android", window.location.origin);
        await Browser.open({ url: url.toString() });
      } catch (error) {
        console.error("Could not open secure sign-in browser:", error);
        setAuthError("Could not open Google sign-in. Please try again.");
      }
      return;
    }
    window.location.assign("/api/auth/google");
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 lg:px-32 relative z-10">
        <div className="absolute top-8 left-8 sm:left-16 md:left-24 lg:left-32">
          <Link href="/" className="flex items-center gap-3 group">
            <h1 className="text-2xl font-black tracking-tight text-primary">
              Echo ♪
            </h1>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto mt-12">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary mb-2">
            Welcome in.
          </h2>
          <p className="text-primary/70 font-medium mb-10 leading-relaxed">
            {demoSignInEnabled
              ? "Try Echo with a local demo profile, or use Google if this deployment has it configured."
              : "Sign in or create an account to start syncing. We'll show you around once you're inside."}
          </p>

          {demoSignInEnabled && (
            <form onSubmit={onDemoLogin} className="space-y-4">
              <label htmlFor="demo-email" className="text-sm font-semibold text-primary/80">
                Gmail address for your local profile
              </label>
              <Input
                id="demo-email"
                type="email"
                autoComplete="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                pattern="[^@]+@gmail[.]com"
                title="Enter a Gmail address"
                className="h-12 rounded-xl bg-card"
              />
              <Button
                type="submit"
                disabled={isSigningIn}
                className={cn(
                  "w-full flex items-center justify-center gap-3 h-14 ",
                )}
              >
                {isSigningIn ? "Opening your local profile…" : "Continue with demo account"}
              </Button>
              {demoError && (
                <p role="alert" className="text-sm text-destructive">{demoError}</p>
              )}
            </form>
          )}

          {googleSignInEnabled && (
            <Button
              type="button"
              variant="outline"
              onClick={onGoogleLogin}
              className="mt-3 h-12 w-full rounded-xl"
            >
              Continue with Google
            </Button>
          )}

          {authError && (
            <p role="alert" className="mt-3 text-sm text-destructive">{authError}</p>
          )}

          {demoSignInEnabled && (
            <p className="mt-4 text-xs text-primary/55">
              This creates a local-only profile using the Gmail address you enter. It is not verified or used to sign into Google.
            </p>
          )}

          <p className="mt-8 text-center text-xs font-medium text-neutral-400">
            By continuing, you agree to our{" "}
            <Link
              href="#"
              className="underline hover:text-neutral-900 transition-colors"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="underline hover:text-neutral-900 transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 relative bg-card/5 items-center justify-center p-12 overflow-hidden">

        <div className="relative w-full max-w-lg aspect-square">
          <div className="absolute inset-0 overflow-hidden flex flex-col">
            <div
              className="flex-1 flex  transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className="min-w-full  h-full flex flex-col justify-center px-2"
                >
                  <div className=" bg-card backdrop-blur-3xl border w-full px-4 py-6 gap-2 rounded-[2rem] ">
                    {" "}
                    <div className="w-16 h-16 rounded-2xl shadow-sm border border-neutral-500 flex items-center justify-center text-emerald-500 mb-8">
                      <slide.icon size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-3xl font-extrabold tracking-tight text-primary/80 mb-4">
                      {slide.title}
                    </h3>
                    <p className="text-primary/60 font-medium leading-relaxed text-lg">
                      {slide.desc}
                    </p>
                  </div>
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
                      ? "w-8 bg-primary"
                      : "w-2 bg-primary/30 hover:bg-primary",
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
