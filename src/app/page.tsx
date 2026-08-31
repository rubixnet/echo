"use client";

import Image from "next/image";
import {
  Radio,
} from "@/components/icons";
import {
  ArrowRight,
  Zap,
  Globe2,
  Lock,
  Disc3,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import { useState } from "react";
import {
  Play,
} from "@/components/icons";
import {
  Pause,
  AudioLines,
} from "lucide-react";

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
    <div className="bg-background min-h-screen flex flex-col font-sans overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-50/60 rounded-full blur-[120px]" />
      </div>

      <nav className="fixed top-0 left-0 z-50 w-full bg-background backdrop-blur-md px-6 md:px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={logoVariant}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-black tracking-tight text-primary origin-center select-none"
          >
            Echo ♪
          </motion.h1>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
          >
            <Button
              className="mt-4 rounded-full px-6"
            >
              Login
            </Button>
          </Link>
        </div>
      </nav >

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
                className="text-6xl md:text-[5.5rem] font-extrabold tracking-tighter leading-[1.05] mb-6 text-primary origin-bottom-left"
              >
                Music sounds better with your{" "}
                <span className="relative inline-block mt-2">
                  friends
                  <span
                    className="pointer-events-none absolute left-0 right-0 bottom-0 h-[45%] bg-highlight -z-10"
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
                className="text-lg md:text-2xl text-foreground/80 font-medium mb-10 leading-relaxed max-w-xl"
              >
                listen to same songs with your friends at the same time!
              </motion.p>

            </div>


          </div>
        </section>
      </main>

      <footer className="relative w-full h-[40vh] md:h-[50vh] bg-card/20 flex items-end justify-center overflow-hidden mt-auto">
        <h1 className="text-[35vw] md:text-[30vw] leading-[0.7] font-black tracking-tighter bg-gradient-to-b from-neutral-400 to-neutral-200 bg-clip-text text-transparent opacity-50 select-none translate-y-[15%]">
          echo!
        </h1>
      </footer>
    </div >
  );
}
