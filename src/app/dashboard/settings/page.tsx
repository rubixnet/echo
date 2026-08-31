"use client";

import SettingsHeader from "@/components/Settings/SettingsHeader"
import PrivacySection from "@/components/Settings/PrivacySection";
import FriendsSection from "@/components/Settings/FriendsSection";
import FavoriteGenresSection from "@/components/Settings/FavoriteGenreSection";
import HiddenTracksSection from "@/components/Settings/HiddenTracksSection";
import { useUser } from "@/hooks/useUser";

export default function SettingsPage() {
  const user = useUser();

  if (!user) return null;

  return (
    <div className="w-full min-h-full flex justify-center p-3 md:p-10 pb-32 text-foreground bg-background">
      <main className="w-full max-w-3xl space-y-8">
        <SettingsHeader />
        <FriendsSection />
        {/* <FavoriteGenresSection /> */}
        <HiddenTracksSection />
        <PrivacySection />
      </main>
    </div>
  );
}