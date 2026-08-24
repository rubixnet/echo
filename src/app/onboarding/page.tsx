"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const GENRES = [
  {
    name: "Indie Pop",
    coverUrl:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300",
  },
  {
    name: "Lo-Fi Beats",
    coverUrl:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300",
  },
  {
    name: "Synthwave",
    coverUrl:
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300",
  },
  {
    name: "Alternative Rock",
    coverUrl:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300",
  },
  {
    name: "R&B",
    coverUrl:
      "https://images.unsplash.com/photo-1605722243979-fc04016677f5?q=80&w=300",
  },
  {
    name: "Hip Hop",
    coverUrl:
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300",
  },
  {
    name: "Jazz",
    coverUrl:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300",
  },
  {
    name: "EDM",
    coverUrl:
      "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=300",
  },
  {
    name: "Acoustic",
    coverUrl:
      "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=300",
  },
  {
    name: "Ambient",
    coverUrl:
      "https://images.unsplash.com/photo-1493225457124-a1a2a4f0bb4e?q=80&w=300",
  },
  {
    name: "House",
    coverUrl:
      "https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300",
  },
  {
    name: "Metal",
    coverUrl:
      "https://images.unsplash.com/photo-1598387993441-a3637e1066b5?q=80&w=300",
  },
  {
    name: "Shoegaze",
    coverUrl:
      "https://images.unsplash.com/photo-1499415479124-43c32433a620?q=80&w=300",
  },
  {
    name: "Afrobeats",
    coverUrl:
      "https://images.unsplash.com/photo-1516280440502-86101d7ed0bd?q=80&w=300",
  },
  {
    name: "K-Pop",
    coverUrl:
      "https://images.unsplash.com/photo-1615962047392-47d0e527f62c?q=80&w=300",
  },
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300",
];

export default function Onboarding({ user }: { user?: AppUser }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State (null means "untouched", fall back to the user profile)
  const [displayNameInput, setDisplayNameInput] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState<string | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const displayName =
    displayNameInput ?? user?.displayName ?? user?.name ?? "";
  const username =
    usernameInput ??
    user?.username ??
    user?.email?.split("@")[0] ??
    "";
  const avatarUrl = avatarOverride ?? user?.avatarUrl ?? AVATAR_PRESETS[0];

  // Convex Mutations
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const completedOnboarding = useMutation(api.users.completedOnboarding);

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Save file for backend upload
      const url = URL.createObjectURL(file);
      setAvatarOverride(url); // Set local blob URL for immediate UI preview
    }
  };

  const handlePresetSelect = (url: string) => {
    setAvatarOverride(url);
    setSelectedFile(null); // Clear custom file if they switch back to a preset
  };

  const toggleGenre = (genreName: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName)
        : [...prev, genreName],
    );
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/invite?ref=${username || "user"}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = async () => {
    if (!user?._id) return;
    setIsSubmitting(true);

    try {
      let finalStorageId = undefined;

      // Securely upload custom image to Convex Storage if one was selected
      if (selectedFile) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await result.json();
        finalStorageId = storageId;
      }

      // Submit all collected data to the backend
      await completedOnboarding({
        userId: user._id,
        displayName,
        username,
        genres: selectedGenres,
        storageId: finalStorageId,
        avatarUrl: selectedFile ? undefined : avatarUrl,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding", error);
      alert(
        error instanceof Error && error.message
          ? error.message
          : "Failed to complete onboarding. Username might be taken.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col justify-between p-6 sm:p-12 lg:p-16">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between border-b border-foreground/10 pb-6">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={cn(
                "h-1 transition-all duration-300",
                step === i
                  ? "w-8 bg-foreground"
                  : step > i
                    ? "w-3 bg-foreground/40 cursor-pointer"
                    : "w-3 bg-foreground/10",
              )}
            />
          ))}
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto my-auto py-12">
        {/* STEP 1: Alias & Avatar */}
        {step === 1 && (
          <div className="space-y-10">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">
                Claim your alias.
              </h1>
              <p className="text-sm font-medium text-foreground/50 mt-2 max-w-lg">
                This is how friends see you in rooms and shared feeds. No real
                names required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              <div className="md:col-span-7 flex flex-col justify-between border border-foreground/10 p-8 rounded-lg bg-foreground/[0.01]">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="e.g. Neon Knight"
                      className="w-full bg-transparent border-b border-foreground/20 py-2 text-xl font-bold text-foreground placeholder:text-foreground/20 focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                      Handle / Username
                    </label>
                    <div className="flex items-center text-xl font-bold text-foreground/40 border-b border-foreground/20">
                      <span>@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) =>
                          setUsernameInput(
                            e.target.value.toLowerCase().replace(/\s+/g, "_"),
                          )
                        }
                        placeholder="username"
                        className="w-full bg-transparent py-2 text-xl font-bold text-foreground placeholder:text-foreground/20 focus:outline-none transition-colors ml-1"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs font-mono text-foreground/40 pt-6">
                  {username ? `@${username}` : "@alias"} · ready to listen
                </p>
              </div>

              <div className="md:col-span-5 flex flex-col justify-between border border-foreground/10 p-8 rounded-lg bg-foreground/[0.01]">
                <div className="space-y-6">
                  <label className="text-xs font-mono uppercase tracking-wider text-foreground/50">
                    Avatar Image
                  </label>

                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border border-foreground/20 shrink-0 group">
                      <Image width={500} height={500} unoptimized
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-mono text-foreground text-center p-1"
                      >
                        Upload
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomAvatarUpload}
                      className="hidden"
                    />

                    <div className="space-y-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-medium border-foreground/20 rounded-md"
                      >
                        Choose Custom
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-foreground/10">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => handlePresetSelect(url)}
                        className={cn(
                          "w-9 h-9 rounded-md overflow-hidden border transition-all",
                          avatarUrl === url
                            ? "border-foreground ring-1 ring-foreground"
                            : "border-transparent opacity-40 hover:opacity-100",
                        )}
                      >
                        <Image width={500} height={500} unoptimized
                          src={url}
                          alt="preset"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  disabled={!displayName.trim() || !username.trim()}
                  onClick={() => setStep(2)}
                  className="w-full py-5 mt-6 rounded-md font-bold text-xs uppercase tracking-wider"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Genres */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">
                Select your genres.
              </h1>
              <p className="text-sm font-medium text-foreground/50 mt-2 max-w-lg">
                Pick up to 5 genres to calibrate your initial Echo feed and live
                recommendations.
              </p>
            </div>

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
                      isDisabled
                        ? "opacity-40 grayscale cursor-not-allowed"
                        : "hover:border-foreground/10",
                    )}
                  >
                    <div className="relative aspect-square w-full rounded-md overflow-hidden bg-foreground/5 shadow-sm mb-3">
                      <Image width={500} height={500} unoptimized
                        src={genre.coverUrl}
                        alt={genre.name}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-300",
                          isSelected ? "scale-105" : "group-hover:scale-105",
                        )}
                      />

                      {/* Selection Overlay */}
                      <div
                        className={cn(
                          "absolute inset-0 transition-opacity flex items-center justify-center",
                          isSelected
                            ? "bg-black/50 opacity-100"
                            : "bg-black/40 opacity-0 group-hover:opacity-100",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shadow-md transform transition-transform",
                            isSelected
                              ? "bg-foreground text-background scale-100"
                              : "bg-background text-foreground scale-90 group-hover:scale-100",
                          )}
                        >
                          <Check size={18} className="stroke-[3px]" />
                        </div>
                      </div>
                    </div>

                    <h3
                      className={cn(
                        "font-bold text-sm truncate transition-colors",
                        isSelected
                          ? "text-foreground"
                          : "text-foreground/80 group-hover:text-foreground",
                      )}
                    >
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

        {/* STEP 3: Features */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">
                Built for listening together.
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-md border border-foreground/10 flex flex-col justify-between min-h-[200px]">
                <span className="text-xs font-mono text-foreground/40">
                  01 // LIVE
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Sync Playback
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                    Listen to tracks in exact lock-step with friends in
                    real-time.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-md border border-foreground/10 flex flex-col justify-between min-h-[200px]">
                <span className="text-xs font-mono text-foreground/40">
                  02 // ACTIVITY
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Live Activity Feed
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                    See what tracks your inner circle is bumping directly from
                    the sidebar.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-md border border-foreground/10 flex flex-col justify-between min-h-[200px]">
                <span className="text-xs font-mono text-foreground/40">
                  03 // SOCIAL
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Shared Libraries
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                    Explore favorite songs, check play history, and clone
                    playlists.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-foreground/10">
              <Button
                onClick={() => setStep(4)}
                className="px-8 py-5 rounded-md font-bold text-xs uppercase tracking-wider"
              >
                Next Step
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Invite & Finish */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mt-1">
                Invite your circle.
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 p-6 rounded-md border border-foreground/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Invite Link
                  </span>
                  <h3 className="text-xl font-bold tracking-tight mt-1">
                    Listen Together Rooms
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1">
                    Share your personal link to host live audio rooms.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 border border-foreground/10 p-1.5 rounded-md">
                  <span className="text-xs font-mono text-foreground/60 truncate flex-1 px-3">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/invite?ref=${username}`
                      : `/invite?ref=${username}`}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyInvite}
                    className="rounded-sm text-xs font-mono shrink-0 border-foreground/20"
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="md:col-span-4 p-6 rounded-md border border-foreground/10 flex flex-col justify-between min-h-[180px]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                  Stats
                </span>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Taste Overlap
                  </h3>
                  <p className="text-xs text-foreground/50 mt-1">
                    Compare matching artists automatically when friends join.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
              <button
                type="button"
                onClick={handleComplete}
                className="text-xs font-mono uppercase text-foreground/40 hover:text-foreground transition-colors"
              >
                Skip for now oh my man! you did amazing man! this 2 designs are
                great as well!
              </button>

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
