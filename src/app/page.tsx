"use client";

import Image from "next/image";
import { ArrowRight, Zap, Globe2, Radio, Lock, Disc3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { useState } from "react";
import { Play, Pause, AudioLines } from "lucide-react";

export default function Homepage() {
  const logoVariant = {
    hidden: { opacity: 0, scale: 0.5, rotate: 10 },
    visible: { opacity: 1, scale: 1, rotate: 0 },
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
  };

  const [progress, setProgress] = useState(45);
  const [isPlaying, setIsPlaying] = useState(true);

  const trackInfo = {
    title: "WE FELL IN LOVE IN OCTOBER",
    artist: "GIRL IN RED",
    session: "ECHO SYNC ROOM #04",
  };

  const grooveText = `${trackInfo.title} • ${trackInfo.artist} • ${trackInfo.session} • `;

  return (
    <div className="bg-[#fcfcfc] min-h-screen flex flex-col font-sans overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-50/60 rounded-full blur-[120px]" />
      </div>

      <nav className="fixed top-0 left-0 z-50 w-full bg-[#fcfcfc]/90 backdrop-blur-md px-6 md:px-10 py-5 flex justify-between items-center border-b border-neutral-200/50">
        <div className="flex items-center gap-3">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={logoVariant}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-black tracking-tight text-neutral-900 origin-center select-none"
          >
            Echo ♪
          </motion.h1>
        </div>

        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "linear" }}
          >
            <Link
              href="/login"
              className={buttonVariants({ variant: "secondary" })}
            >
              login
            </Link>
          </motion.div>
        </div>
      </nav>

      <main className="w-full flex-1 flex flex-col z-10 pt-32">
        <section className="relative w-full min-h-[85vh] flex items-center justify-center pb-20 px-6 md:px-10 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12 items-center w-full mx-auto">
            <div className="flex flex-col items-start text-left lg:col-span-6 xl:col-span-7 z-20">
              <motion.h2
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 24, rotate: 1.5 },
                  visible: { opacity: 1, y: 0, rotate: 0 },
                }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="text-6xl md:text-[5.5rem] font-extrabold tracking-tighter leading-[1.05] mb-6 text-neutral-900 origin-bottom-left"
              >
                Music sounds better with your{" "}
                <span className="relative inline-block mt-2">
                  friends
                  <span
                    className="pointer-events-none absolute left-0 right-0 bottom-0 h-[45%] bg-emerald-300 -z-10"
                    aria-hidden="true"
                  />
                </span>
                .
              </motion.h2>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="text-lg md:text-2xl text-neutral-500 font-medium mb-10 leading-relaxed max-w-xl"
              >
                listen to same songs with your friends at the same time!
              </motion.p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "group bg-neutral-900 text-white px-8 py-6 text-lg hover:bg-neutral-800 transition-colors",
                  )}
                >
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex justify-center relative lg:col-span-6 xl:col-span-5"
            >
              <div className="w-full max-w-[540px] flex flex-col items-center gap-8 p-6">
                <div className="relative w-full aspect-square flex items-center justify-center">
                  <div
                    className="absolute inset-4 rounded-full blur-[90px] transition-all duration-700 -z-10 opacity-70"
                    style={{
                      background: `radial-gradient(circle, rgba(52, 211, 153, ${progress / 100}) 0%, rgba(59, 130, 246, ${progress / 120}) 50%, transparent 80%)`,
                    }}
                  />

                  <div className="absolute inset-0 rounded-full border border-neutral-200/40 shadow-inner" />
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-20">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="49.5%"
                      stroke="rgba(16, 185, 129, 0.4)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="310%"
                      strokeDashoffset={`${310 - (310 * progress) / 100}%`}
                      strokeLinecap="round"
                      className="transition-all duration-300 ease-linear"
                    />
                  </svg>

                  <div
                    className={`w-[96%] aspect-square rounded-full relative flex items-center justify-center overflow-hidden border border-white/60 shadow-[0_30px_70px_rgba(0,0,0,0.12)] backdrop-blur-xl bg-white/20 transition-transform duration-1000 ${
                      isPlaying ? "animate-[spin_12s_linear_infinite]" : ""
                    }`}
                  >
                    <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.35)_45deg,transparent_90deg,rgba(255,255,255,0.35)_225deg,transparent_270deg)] pointer-events-none z-30" />

                    <div
                      className="absolute rounded-full transition-all duration-500 pointer-events-none opacity-85 mix-blend-multiply"
                      style={{
                        width: `${Math.max(15, progress)}%`,
                        height: `${Math.max(15, progress)}%`,
                        background: `
                radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.85) 0%, transparent 60%),
                radial-gradient(circle at 70% 70%, rgba(99, 102, 241, 0.8) 0%, transparent 65%),
                conic-gradient(from 45deg, #a7f3d0, #6366f1, #38bdf8, #a7f3d0)
              `,
                        filter: `blur(${Math.max(4, 20 - progress / 6)}px) contrast(1.4)`,
                        transform: `scale(${1 + progress / 100}) rotate(${progress * 2}deg)`,
                      }}
                    />

                    <div className="absolute inset-6 rounded-full border border-white/20 pointer-events-none" />
                    <div className="absolute inset-16 rounded-full border border-white/15 pointer-events-none" />
                    <div className="absolute inset-28 rounded-full border border-white/10 pointer-events-none" />

                    <svg
                      viewBox="0 0 500 500"
                      className="absolute inset-0 w-full h-full opacity-65 z-20 pointer-events-none"
                    >
                      <defs>
                        <path
                          id="pathOuter"
                          d="M 250, 250 m -215, 0 a 215,215 0 1,1 430,0 a 215,215 0 1,1 -430,0"
                        />
                        <path
                          id="pathMid"
                          d="M 250, 250 m -165, 0 a 165,165 0 1,1 330,0 a 165,165 0 1,1 -330,0"
                        />
                        <path
                          id="pathInner"
                          d="M 250, 250 m -115, 0 a 115,115 0 1,1 230,0 a 115,115 0 1,1 -230,0"
                        />
                      </defs>
                      <text
                        fontSize="8.5"
                        fill="#1e293b"
                        fontWeight="700"
                        letterSpacing="3"
                        className="uppercase font-mono"
                      >
                        <textPath href="#pathOuter">
                          {grooveText.repeat(4)}
                        </textPath>
                        <textPath href="#pathMid">
                          {grooveText.repeat(3)}
                        </textPath>
                        <textPath href="#pathInner">
                          {grooveText.repeat(2)}
                        </textPath>
                      </text>
                    </svg>

                    <div className="w-[28%] aspect-square rounded-full border-[3px] border-white/80 shadow-xl relative overflow-hidden bg-neutral-900 z-40">
                      <Image width={500} height={500} unoptimized
                        src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop"
                        alt="Album Art"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-neutral-100 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] border border-neutral-300 flex items-center justify-center">
                        <div className="w-1 h-1 bg-neutral-800 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-neutral-200/70 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 font-mono">
                    <span className="flex items-center gap-1.5 text-neutral-800">
                      <AudioLines
                        size={14}
                        className="text-emerald-500 animate-pulse"
                      />
                      LIVE PROGRESS PREVIEW
                    </span>
                    <span>
                      {Math.floor((progress * 180) / 100)}s / 180s ({progress}%)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="flex justify-between items-center pt-1">
                    <div>
                      <p className="text-sm font-bold text-neutral-900 leading-none">
                        We fell in love in october
                      </p>
                      <p className="text-xs text-neutral-500 font-medium mt-0.5">
                        girl in red
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition"
                    >
                      {isPlaying ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} className="ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-24 px-6 md:px-10 max-w-7xl mx-auto w-full border-t border-neutral-200/50 mt-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariant}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tight mb-4">
              It’s incredibly simple.
            </h2>
            <p className="text-lg text-neutral-500 font-medium text-balance">
              No complicated setups. Just create a room, send a link, and start
              listening to the exact same track together.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-none border border-neutral-200 bg-white shadow-sm"
            >
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mb-6 text-neutral-900 border border-neutral-200">
                <Radio size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Create a Session
              </h3>
              <p className="text-neutral-500 font-medium">
                Start a private listening room with one tap. You have the
                remote.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center text-center p-6 rounded-none border border-neutral-200 bg-white shadow-sm"
            >
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mb-6 text-neutral-900 border border-neutral-200">
                <Globe2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Share the Link
              </h3>
              <p className="text-neutral-500 font-medium">
                Send your session link to friends anywhere in the world.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUpVariant}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center text-center p-6 rounded-none border border-neutral-200 bg-white shadow-sm"
            >
              <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mb-6 text-neutral-900 border border-neutral-200">
                <Disc3 size={24} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">
                Vibe Together
              </h3>
              <p className="text-neutral-500 font-medium">
                When you hit play, it plays for everyone. Perfectly synced
                audio.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-24 px-6 md:px-10">
          <div className="max-w-7xl mx-auto bg-neutral-950 rounded-sm p-10 md:p-16 overflow-hidden relative shadow-2xl">
            <div className="relative z-10 mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                Engineered for audiophiles.
              </h2>
              <p className="text-lg text-neutral-400 font-medium max-w-xl">
                We didn&apos;t just build a social tool. We built a high-fidelity
                sync engine that respects your music.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-8">
                <Zap className="text-neutral-400 mb-6" size={32} />
                <h3 className="text-2xl font-bold text-white mb-3">
                  Zero Latency Sync
                </h3>
                <p className="text-neutral-400 font-medium leading-relaxed">
                  Our proprietary WebRTC engine ensures that your playback is
                  synchronized down to the millisecond. No awkward delays or
                  echoing.
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-sm p-8">
                <Lock className="text-neutral-400 mb-6" size={32} />
                <h3 className="text-2xl font-bold text-white mb-3">
                  End-to-End Secure
                </h3>
                <p className="text-neutral-400 font-medium leading-relaxed">
                  Your sessions are fully encrypted. We don&apos;t track your
                  listening habits, and we don&apos;t sell your data. Your room is
                  your room.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tighter mb-6">
            Ready to hit play?
          </h2>
          <p className="text-xl text-neutral-500 font-medium mb-10 max-w-2xl">
            Join the platform that actually makes listening to music a shared
            experience again. No invites required, totally free to start.
          </p>
          <Link
            href="/signup"
            className="bg-neutral-900 text-white px-10 py-5 font-bold text-xl hover:bg-neutral-800 transition-colors flex items-center gap-2 rounded-sm"
          >
            Create Your Account
            <ArrowRight size={24} />
          </Link>
        </section>
      </main>

      <footer className="relative w-full h-[40vh] md:h-[50vh] bg-neutral-100 flex items-end justify-center overflow-hidden border-t border-neutral-200/50 mt-auto">
        <h1 className="text-[35vw] md:text-[30vw] leading-[0.7] font-black tracking-tighter bg-gradient-to-b from-neutral-400 to-neutral-200 bg-clip-text text-transparent opacity-50 select-none translate-y-[15%]">
          echo!
        </h1>
      </footer>
    </div>
  );
}
