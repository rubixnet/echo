"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils"

import { Music, Check, ArrowRight } from "lucide-react"

const GENRES = [
    "Indie Pop", "Lo-Fi Beats", "Alternative Rock", "R&B",
    "Hip Hop", "Synthwave", "Jazz", "Classical",
    "EDM", "Acoustic", "K-Pop", "Afrobeats",
    "Shoegaze", "Ambient", "House", "Metal"
];

export default function Onboarding({ user }: { user?: any }) {
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const completedOnboarding = useMutation(api.users.completedOnboarding);

    const toggleGenre = (genre: string) => {

        if (selected.includes(genre)) {
            setSelected(selected.filter((genre) => genre !== genre))
        } else {
            if (selected.length < 5) {
                setSelected([...selected, genre])
            }
        }
    }

    const handleComplete = async () => {
        if (!user?._id) return;

        setIsSubmitting(true);
        try {
            await completedOnboarding({
                userId: user._id,
                genres: selected,
            })
            router.push("/dashboard")
        } catch (error) {
            console.error("Failed to complete onboarding", error);
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 selection:bg-emerald-200">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-neutral-200/60 p-8 md:p-12">

                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                    <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center shadow-lg mb-2">
                        <Music size={28} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tight">
                        Tune your frequency.
                    </h1>
                    <p className="text-neutral-500 font-medium max-w-sm">
                        Select up to 5 genres to calibrate your initial Echo feed and live room recommendations.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {GENRES.map((genre) => {
                        const isSelected = selected.includes(genre);
                        return (
                            <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className={cn(
                                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border",
                                    isSelected
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-md scale-105"
                                        : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50"
                                )}
                            >
                                {genre}
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-col items-center border-t border-neutral-100 pt-8">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
                        {selected.length} / 5 Selected
                    </p>
                    <button
                        onClick={handleComplete}
                        disabled={selected.length === 0 || isSubmitting}
                        className={cn(
                            "flex items-center gap-2 px-8 py-4 rounded-full font-black transition-all",
                            selected.length > 0
                                ? "bg-neutral-900 text-white shadow-xl hover:scale-105 active:scale-95"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? "Calibrating..." : "Launch Echo"}
                        {!isSubmitting && <ArrowRight size={18} strokeWidth={3} />}
                    </button>
                </div>

            </div>
        </div>
    );
}

