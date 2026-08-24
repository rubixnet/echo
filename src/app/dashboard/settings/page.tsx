"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { User, LogOut, Music, MoreVertical, Pencil } from "lucide-react";

type HatedTrack =
  | string
  | {
      trackId?: string;
      _id?: string;
      name?: string;
      title?: string;
      artist?: string;
      coverUrl?: string;
    };

export default function SettingsPage() {
  const user = useUser();

  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const userData = useQuery(
    api.users.getUserData,
    user?._id ? { userId: user._id } : "skip"

  );

  const [draft, setDraft] = useState({
    displayName: "",
    username: "",
    avatarUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const displayName = isEditingProfile
    ? draft.displayName
    : user?.displayName || user?.name || "";
  const username = isEditingProfile ? draft.username : user?.username || "";
  const avatarUrl = isEditingProfile ? draft.avatarUrl : user?.avatarUrl || "";

  const handleStartEdit = () => {
    setDraft({
      displayName: user?.displayName || user?.name || "",
      username: user?.username || "",
      avatarUrl: user?.avatarUrl || "",
    });
    setSelectedFile(null);
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setSelectedFile(null);
    setIsEditingProfile(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDraft((d) => ({ ...d, avatarUrl: URL.createObjectURL(file) }));
    }
  };

  const hatedTrackIds = useQuery(
    api.neverShowAgain.getUserHatedTracks,
    user?._id ? { userId: user._id } : "skip"
  );
  const toggleHated = useMutation(api.neverShowAgain.togglehated);

  const handleUnhideTrack = async (trackId: string) => {
    if (!user?._id) return;
    try {
      await toggleHated({ userId: user._id, trackId });
    } catch (error) {
      console.error("Failed to unhide track", error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUserId = user?._id || user?.workosId;
    if (!targetUserId) return;

    setIsSaving(true);

    try {
      let finalStorageId = undefined;

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

      await updateProfile({
        userId: targetUserId,
        displayName: displayName,
        username: username,
        avatarUrl: selectedFile ? undefined : avatarUrl,
        storageId: finalStorageId,
      });

      setIsEditingProfile(false);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error && error.message
          ? error.message
          : "Failed to update profile. Username might be taken."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background w-full pb-32">
      <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 space-y-8 md:space-y-12">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
          <main className="flex-1 w-full min-w-0 relative">
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
                <div className="w-28 h-28 select-none md:w-40 md:h-40 rounded-full object-cover border-2 border-foreground/10 shrink-0 relative group">
                  {avatarUrl ? (
                    <Image width={500} height={500} unoptimized src={avatarUrl} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105 rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/30 group-hover:text-foreground/50 transition-colors rounded-full">
                      <User size={36} />
                    </div>
                  )}

                  {isEditingProfile && (
                    <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-full cursor-pointer">
                      <Pencil size={18} className="text-foreground" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="font-normal">
                      <h3 className="text-4xl md:text-6xl text-balance font-black tracking-tighter leading-none text-foreground">
                        {displayName || userData?.name || "displayname"}
                      </h3>
                    </span>

                    <span className="font-normal">
                      <h3 className="text-2xl md:text-4xl text-normal font-serif tracking-tighter leading-none text-foreground">
                        {username || "username"}
                      </h3>
                    </span>

                    <div className="pt-6 flex items-center gap-4 mt-8">
                      {!isEditingProfile ? (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleStartEdit();
                          }}
                          className="w-11 px-0 shadow-none sm:w-auto sm:px-5"
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="w-11 px-0 shadow-none sm:w-auto sm:px-5"
                          >
                            Cancel
                          </Button>

                          <Button
                            type="submit"
                            onClick={handleSaveProfile}
                            disabled={isSaving || (!displayName && !username)}
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </>
                      )}
                      <a
                        href="/api/auth/logout"
                        title="Log out"
                        className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
              </form>

              <div className="w-full max-w-5xl pt-10 border-t border-foreground/10 space-y-5">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">Favorite Genres</h3>

                </div>

                {userData === undefined ? (
                  <div className="text-sm text-foreground/50 animate-pulse">Loading genres...</div>
                ) : userData?.favoriteGenres && userData.favoriteGenres.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {userData.favoriteGenres.map((genre: string, idx: number) => (
                      <div
                        key={idx}
                        className="px-5 py-2.5 text-sm font-semibold rounded-full bg-foreground/[0.03] border border-foreground/10 text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-colors capitalize cursor-default"
                      >
                        {genre}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/50">Not genres selected</p>
                )}
              </div>
              <div className="w-full max-w-5xl mt-16 space-y-6">
                <div className="flex flex-col md:flex-row items-end gap-6 mb-8 pt-12 border-t border-foreground/10">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Never Show Again
                  </h2>
                </div>

                <div className="flex flex-col w-full pb-10">
                  {hatedTrackIds === undefined ? (
                    <div className="text-sm text-foreground/50 animate-pulse px-4 py-8">Loading hidden tracks...</div>
                  ) : hatedTrackIds.length === 0 ? (
                    <div className="text-sm text-foreground/50 px-4 py-8">You haven&apos;t Hated any tracks yet.</div>
                  ) : (
                    hatedTrackIds.map((track: HatedTrack) => {
                      const isString = typeof track === "string";
                      const trackId = isString ? track : (track.trackId || track._id || "");
                      const songName = isString ? "Unknown Song" : (track.name || track.title || "Unknown Song");
                      const artistName = isString ? "Hidden Artist" : (track.artist || "Hidden Artist");
                      const coverUrl = isString ? null : track.coverUrl;

                      return (
                        <div key={trackId} className="group flex items-center justify-between py-2.5 px-4 rounded-md hover:bg-foreground/10 transition-colors cursor-default">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-10 h-10 shrink-0 bg-foreground/10 rounded overflow-hidden shadow-sm">
                              {coverUrl ? (
                                <Image width={500} height={500} unoptimized src={coverUrl} alt={songName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Music size={16} className="text-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-[15px] font-bold text-foreground truncate">{songName}</span>
                              <span className="text-[13px] text-foreground/60 truncate mt-0.5">{artistName}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 shrink-0 pl-4">




                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleUnhideTrack(trackId);
                              }}
                              className="text-xs font-semibold h-8 hidden group-hover:flex transition-all bg-background"
                            >
                              Unhide
                            </Button>

                            <MoreVertical size={18} className="text-foreground/40 group-hover:text-foreground/80 hidden sm:block cursor-pointer transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}