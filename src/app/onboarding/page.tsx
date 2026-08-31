"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { LiquidContainer } from "@/components/LiquidUI/LiquidContainer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AtSign,
  X,
} from "lucide-react";

const ENABLE_OUTRO_TRANSITION = true;
const MAX_GENRES = 5;

const GENRES = [
  {
    id: "electronic",
    label: "Electronic",
    color: "rgba(139, 92, 246, 0.28)",
  },
  {
    id: "ambient",
    label: "Ambient",
    color: "rgba(56, 189, 248, 0.28)",
  },
  {
    id: "hip-hop",
    label: "Hip Hop",
    color: "rgba(249, 115, 22, 0.28)",
  },
  {
    id: "indie-rock",
    label: "Indie Rock",
    color: "rgba(244, 63, 94, 0.28)",
  },
  {
    id: "synthwave",
    label: "Synthwave",
    color: "rgba(217, 70, 239, 0.28)",
  },
  {
    id: "jazz-soul",
    label: "Jazz & Soul",
    color: "rgba(234, 179, 8, 0.28)",
  },
  {
    id: "classical",
    label: "Classical",
    color: "rgba(34, 197, 94, 0.28)",
  },
  {
    id: "lo-fi",
    label: "Lo-Fi Beats",
    color: "rgba(20, 184, 166, 0.28)",
  },
  {
    id: "techno",
    label: "Techno / Club",
    color: "rgba(99, 102, 241, 0.28)",
  },
  {
    id: "post-punk",
    label: "Post-Punk",
    color: "rgba(148, 163, 184, 0.28)",
  },
  {
    id: "r-and-b",
    label: "R&B",
    color: "rgba(251, 146, 60, 0.28)",
  },
  {
    id: "folk",
    label: "Folk & Acoustic",
    color: "rgba(163, 230, 53, 0.28)",
  },
  {
    id: "pop",
    label: "Pop",
    color: "rgba(236, 72, 153, 0.28)",
  },
  {
    id: "metal",
    label: "Metal",
    color: "rgba(71, 85, 105, 0.28)",
  },
  {
    id: "reggae",
    label: "Reggae",
    color: "rgba(16, 185, 129, 0.28)",
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useUser();
  const convex = useConvex();

  const updateUserData = useMutation(api.users.updateUserData);

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "valid" | "taken" | "invalid"
  >("idle");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [previewSlider, setPreviewSlider] = useState(65);

  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<"sync" | "ready">("sync");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isUserReady = Boolean(user && "_id" in user && user._id);

  useEffect(() => {
    if (step === 1 && isUserReady) {
      nameInputRef.current?.focus();
    }
  }, [step, isUserReady]);

  useEffect(() => {
    if (user) {
      if (user.favoriteGenres && user.favoriteGenres.length > 0 && selectedGenres.length === 0) {
        setSelectedGenres(user.favoriteGenres);
      }
    }
  }, [user]);

  const playCompletionChime = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      [587.33, 880.0, 1174.66].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.9);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.95);
      });
    } catch {
    }
  };

  useEffect(() => {
    const trimmed = username.trim().toLowerCase();

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!trimmed) {
      setUsernameStatus("idle");
      setIsCheckingUsername(false);
      return;
    }

    if (trimmed.length < 3 || !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameStatus("invalid");
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const matches = await convex.query(api.users.searchUsers, {
          query: trimmed,
        });

        const exactMatch = matches?.some(
          (u: any) =>
            u.username?.toLowerCase() === trimmed && u._id !== user?._id
        );

        if (exactMatch) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("valid");
        }
      } catch {
        setUsernameStatus("valid");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [username, convex, user?._id]);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      }
      if (prev.length >= MAX_GENRES) {
        return prev;
      }
      return [...prev, genreId];
    });
  };

  const textInputTint = useMemo(() => {
    const inputStr = `${name}${username}`;
    if (!inputStr) return null;

    let hash = 0;
    for (let i = 0; i < inputStr.length; i++) {
      hash = inputStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsla(${hue}, 65%, 55%, 0.16)`;
  }, [name, username]);

  const dynamicBackgroundStyle = useMemo(() => {
    const gradients: string[] = [];

    if (step === 1 && textInputTint) {
      gradients.push(
        `radial-gradient(circle at 50% 40%, ${textInputTint} 0%, transparent 60%)`
      );
    }

    if (selectedGenres.length > 0) {
      const selectedColors = selectedGenres.map(
        (id) =>
          GENRES.find((g) => g.id === id)?.color || "rgba(100, 100, 100, 0.15)"
      );

      selectedColors.forEach((color, index) => {
        const angle = (index / selectedColors.length) * 360;
        const x = 50 + 35 * Math.cos((angle * Math.PI) / 180);
        const y = 50 + 35 * Math.sin((angle * Math.PI) / 180);
        gradients.push(
          `radial-gradient(circle at ${x}% ${y}%, ${color} 0%, transparent 60%)`
        );
      });
    }

    if (gradients.length === 0) {
      return "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 80%)";
    }

    return gradients.join(", ");
  }, [selectedGenres, textInputTint, step]);

  const handleStep2Submit = async () => {
    if (!user?._id) {
      setErrorMsg("User session is still initializing. Please wait a second.");
      return;
    }

    try {
      setIsSavingStep2(true);
      setErrorMsg(null);

      await updateUserData({
        userId: user._id,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        favoriteGenres: selectedGenres,
      });

      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile.");
    } finally {
      setIsSavingStep2(false);
    }
  };

  const handleFinalSubmit = () => {
    playCompletionChime();

    if (ENABLE_OUTRO_TRANSITION) {
      setIsTransitioning(true);
      setTimeout(() => setTransitionPhase("ready"), 1200);
      setTimeout(() => router.push("/dashboard"), 2400);
    } else {
      router.push("/dashboard");
    }
  };

  if (!isUserReady || user === undefined) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 size={24} className="animate-spin text-foreground/40" />
        <p className="text-xs font-mono text-foreground/40">Initializing session...</p>
      </div>
    );
  }

  const isStep1Valid =
    name.trim().length > 0 &&
    (usernameStatus === "valid" || (user?.username && username === user.username.toLowerCase())) &&
    !isCheckingUsername;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-background text-foreground overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-1000 ease-out opacity-80"
        style={{ backgroundImage: dynamicBackgroundStyle }}
      />

      {isTransitioning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="flex flex-col items-center space-y-6 text-center max-w-sm px-6">
            <div className="flex items-center gap-1.5 h-8">
              <span className="w-1 bg-foreground rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4" />
              <span className="w-1 bg-foreground rounded-full animate-[pulse_0.8s_ease-in-out_0.2s_infinite] h-8" />
              <span className="w-1 bg-foreground rounded-full animate-[pulse_0.8s_ease-in-out_0.4s_infinite] h-6" />
              <span className="w-1 bg-foreground rounded-full animate-[pulse_0.8s_ease-in-out_0.1s_infinite] h-3" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {transitionPhase === "sync"
                  ? "Configuring your workspace"
                  : `Welcome, ${name || username}`}
              </h2>
              <p className="text-xs font-mono text-foreground/40">
                {transitionPhase === "sync"
                  ? "Calibrating frequency streams & audio grid..."
                  : "Launching personal audio dashboard..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 w-full max-w-lg min-h-[460px] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  step === idx + 1
                    ? "w-8 bg-foreground"
                    : step > idx + 1
                      ? "w-4 bg-foreground/40"
                      : "w-2 bg-foreground/15"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono text-foreground/40 tracking-wider">
            0{step} / 0{totalSteps}
          </span>
        </div>

        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
            <div className="space-y-8">
              <div className="space-y-1">
                <h1 className="text-xl font-medium tracking-tight text-foreground">
                  Set up your identity
                </h1>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-foreground/60 tracking-wide uppercase px-3">
                    Display Name
                  </label>
                  <LiquidContainer radius="16px" className="w-full h-[42px] shadow-none">
                    <div className="w-full h-full rounded-[50px] bg-black/5 dark:bg-black/30 flex items-center px-5 focus-within:bg-black/10 dark:focus-within:bg-black/50 transition-colors">
                      <input
                        ref={nameInputRef}
                        type="text"
                        placeholder="e.g. Alex Rivera"
                        value={name}
                        autoComplete="off"
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-foreground/40 focus:outline-none"
                      />
                    </div>
                  </LiquidContainer>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-3">
                    <label className="text-[11px] font-medium text-foreground/60 tracking-wide uppercase">
                      Unique Handle
                    </label>
                    <div className="flex items-center gap-1 text-[11px] font-mono">
                      {isCheckingUsername ? (
                        <span className="text-foreground/40 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> checking</span>
                      ) : usernameStatus === "valid" ? (
                        <span className="text-emerald-500 flex items-center gap-1"><Check size={11} /> available</span>
                      ) : usernameStatus === "taken" ? (
                        <span className="text-red-400 flex items-center gap-1"><X size={11} /> handle taken</span>
                      ) : usernameStatus === "invalid" && username.trim().length > 0 ? (
                        <span className="text-amber-500/80">3+ chars (letters, nums, _)</span>
                      ) : null}
                    </div>
                  </div>

                  <LiquidContainer radius="16px" className="w-full h-[42px] shadow-none">
                    <div className="w-full h-full rounded-[50px] bg-black/5 dark:bg-black/30 flex items-center px-5 focus-within:bg-black/10 dark:focus-within:bg-black/50 transition-colors gap-1.5">
                      <span className="text-foreground/40 text-sm font-mono pt-[1px]"><AtSign size={11} /></span>
                      <input
                        type="text"
                        placeholder="handle"
                        value={username}
                        autoComplete="off"
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && isStep1Valid) {
                            e.preventDefault();
                            setStep(2);
                          }
                        }}
                        className="w-full bg-transparent text-sm font-mono text-foreground placeholder:text-foreground/40 focus:outline-none"
                      />
                    </div>
                  </LiquidContainer>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-foreground/10">
              <Button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="h-9 px-4 text-xs font-medium rounded-xl gap-2 active:scale-98 transition-transform cursor-pointer"
              >
                Continue
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-xl font- tracking-tight text-foreground">
                    Select your genres
                  </h1>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md border border-foreground/10 bg-foreground/[0.02] text-foreground/60">
                  {selectedGenres.length} / {MAX_GENRES}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {GENRES.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  const isMaxReached = selectedGenres.length >= MAX_GENRES && !isSelected;
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      disabled={isMaxReached}
                      onClick={() => toggleGenre(genre.id)}
                      className={cn(
                        "h-20 w-24 rounded-lg text-xs font-medium border transition-all duration-150 select-none",
                        isSelected
                          ? "border-foreground/30 bg-foreground/10 text-foreground font-semibold active:scale-98 cursor-pointer"
                          : isMaxReached
                            ? "opacity-30 border-foreground/5 bg-transparent cursor-not-allowed text-foreground/40"
                            : "border-foreground/8 bg-foreground/[0.02] text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] active:scale-98 cursor-pointer"
                      )}
                    >
                      {genre.label}
                    </button>
                  );
                })}
              </div>

              {errorMsg && (
                <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-foreground/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                disabled={isSavingStep2}
                className="h-8 px-2.5 text-xs text-foreground/50 hover:text-foreground rounded-xl gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                Back
              </Button>

              <Button
                onClick={handleStep2Submit}
                disabled={selectedGenres.length === 0 || isSavingStep2}
                className="h-9 px-4 text-xs font-medium rounded-xl gap-2 active:scale-98 transition-transform cursor-pointer"
              >
                {isSavingStep2 ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font- tracking-tight text-foreground">
                  Features Layout
                </h1>
              </div>

            </div>

            <div className="flex items-center justify-between pt-6 border-t border-foreground/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
                className="h-8 px-2.5 text-xs text-foreground/50 hover:text-foreground rounded-xl gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                Back
              </Button>

              <Button
                onClick={() => setStep(4)}
                className="h-9 px-4 text-xs font-medium rounded-xl gap-2 active:scale-98 transition-transform cursor-pointer"
              >
                Social & Broadcasts
                <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col justify-between animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-xl font- tracking-tight text-foreground">
                  Friends Layout
                </h1>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-foreground/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(3)}
                className="h-8 px-2.5 text-xs text-foreground/50 hover:text-foreground rounded-xl gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={13} />
                Back
              </Button>

              <Button
                onClick={handleFinalSubmit}
                disabled={isTransitioning}
                className="h-9 px-5 text-xs font-medium rounded-xl gap-2 active:scale-98 transition-transform cursor-pointer"
              >
                {isTransitioning ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Entering...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Echo</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}