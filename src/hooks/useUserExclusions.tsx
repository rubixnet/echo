"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { useMemo } from "react";

export function useUserExclusions() {
  const user = useUser();

  const exclusions = useQuery(
    api.tracks.getCombinedUserExclusions,
    user?._id ? { userId: user._id } : "skip"
  );

  const exclusionSet = useMemo(() => {
    return new Set<string>(exclusions || []);
  }, [exclusions]);


  const isTrackExcluded = (trackId?: string) => {
    if (!trackId) return false;
    return exclusionSet.has(trackId);
  };

  return {
    exclusionSet,
    isTrackExcluded,
    isLoading: exclusions === undefined,
  };
}