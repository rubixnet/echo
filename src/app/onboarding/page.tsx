"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const GENRES = [
  { name: "Indie Pop", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300" },
  { name: "Lo-Fi Beats", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300" },
  { name: "Synthwave", coverUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300" },
  { name: "Alternative Rock", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300" },
  { name: "R&B", coverUrl: "https://images.unsplash.com/photo-1605722243979-fc04016677f5?q=80&w=300" },
  { name: "Hip Hop", coverUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300" },
  { name: "Jazz", coverUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300" },
  { name: "EDM", coverUrl: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=300" },
  { name: "Acoustic", coverUrl: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=300" },
  { name: "Ambient", coverUrl: "https://images.unsplash.com/photo-1493225457124-a1a2a4f0bb4e?q=80&w=300" },
  { name: "House", coverUrl: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300" },
  { name: "Metal", coverUrl: "https://images.unsplash.com/photo-1598387993441-a3637e1066b5?q=80&w=300" },
  { name: "Shoegaze", coverUrl: "https://images.unsplash.com/photo-1499415479124-43c32433a620?q=80&w=300" },
  { name: "Afrobeats", coverUrl: "https://images.unsplash.com/photo-1516280440502-86101d7ed0bd?q=80&w=300" },
  { name: "K-Pop", coverUrl: "https://images.unsplash.com/photo-1615962047392-47d0e527f62c?q=80&w=300" }
];

export default function Onboarding({ user }: { user?: any }) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const completedOnboarding = useMutation(api.users.completedOnboarding);

  const toggleGenre = (genreName: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName]
    );
  };

  const handleComplete = async () => {
    if (!user?._id) return;
    setIsSubmitting(true);
    try {
      await completedOnboarding({
        userId: user._id,
        name: displayName,
        username,
        genres: selectedGenres,
      });

      router.push("/dashboard");
    }

    catch (error: any) {
      console.error("Failed to complete onboarding", error);
      alert(error.message || "Failed to complete onboarding. Username might be taken.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 lg:p-16">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between border-b border-foreground/10 pb-6">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={cn("h-1 transition-all duration-300", step === i ? "w-8 bg-foreground" : step > i ? "w-3 bg-foreground/40 cursor-pointer" : "w-3 bg-foreground/10")}
            />
          ))}
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto my-auto py-12">
        {step === 1 && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              <div className="md:col-span-7 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Neon Knight"
                      className="w-full bg-transparent border-b border-foreground/20 py-2 text-xl font-bold text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-xl font-bold text-foreground/40 border-b border-foreground/20">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))
                        }
                        placeholder="username"
                        className="w-full bg-transparent py-2 text-xl font-bold text-foreground placeholder:text-foreground/20 focus:outline-none transition-colors ml-1"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <button
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.name);
                const isDisabled = !isSelected && selectedGenres.length >= 5;

                return (
                  <div
                    key={genre.name}
                    onClick={() => !isDisabled && toggleGenre(genre.name)}
                    className={cn(
                      "group relative cursor-pointer rounded-md transition-colors",
                      isDisabled ? "opacity-40 grayscale cursor-not-allowed" : "hover:border-foreground/10"
                    )}
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden bg-foreground/5 shadow-sm mb-3">
                      <img
                        src={genre.coverUrl}
                        alt={genre.name}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-300",
                          isSelected ? "scale-105" : "group-hover:scale-105"
                        )}
                      />

                      <div
                        className={cn(
                          "absolute inset-0 transition-opacity flex items-center justify-center",
                          isSelected
                            ? "bg-black/50 opacity-100"
                            : "bg-black/40 opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shadow-md transform transition-transform",
                            isSelected
                              ? "bg-foreground text-background scale-100"
                              : "bg-background text-foreground scale-90 group-hover:scale-100"
                          )}
                        >
                          <Check size={18} className="stroke-[3px]" />
                        </div>
                      </div>
                    </div>

                    <h3 className={cn(
                      "font-bold text-sm truncate transition-colors",
                      isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                    )}>
                      {genre.name}
                    </h3>
                    <p className="text-xs font-medium text-foreground/50 mt-0.5 capitalize">
                      Genre
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-foreground/10">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                {selectedGenres.length} / 5 Selected
              </span>
              <Button
                disabled={selectedGenres.length === 0}
                onClick={() => setStep(3)}
                className="px-8 py-5 rounded-md font-bold text-xs uppercase tracking-wider"
              >
                Save Taste
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setStep(4)}
                className="px-8 py-5 rounded-md font-bold text-xs uppercase tracking-wider"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="flex justify-between items-center pt-4 ">
              <Button
                disabled={isSubmitting}
                onClick={handleComplete}
                className="px-10 py-5 rounded-md font-bold text-xs uppercase tracking-wider"
              >
                {isSubmitting ? "Finalizing..." : "Enter App"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}