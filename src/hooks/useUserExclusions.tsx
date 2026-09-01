"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@/hooks/useUser";
import { useMemo, useCallback } from "react";

export function useUserExclusions() {
  const user = useUser();
  const userId = user?._id;

  const hatedTracks = useQuery(
    api.neverShowAgain.getUserHatedTracks,
    userId ? { userId } : "skip"
  );

  const suggestLessTracks = useQuery(
    api.suggestLess.getUserSuggestLessTracks,
    userId ? { userId } : "skip"
  );

  const neverShowSet = useMemo(() => {
    if (!hatedTracks) return new Set<string>();
    return new Set<string>(
      hatedTracks
        .map((t: { trackId?: string; id?: string }) => t.trackId || t.id)
        .filter((x): x is string => typeof x === "string")
    );
  }, [hatedTracks]);

  const suggestLessSet = useMemo(() => {
    if (!suggestLessTracks) return new Set<string>();
    return new Set<string>(
      suggestLessTracks
        .map((t: { trackId?: string; id?: string } | string) =>
          typeof t === "string" ? t : t.trackId || t.id
        )
        .filter((x): x is string => typeof x === "string")
    );
  }, [suggestLessTracks]);

  const recommendationExclusionSet = useMemo(() => {
    const combined = new Set<string>(neverShowSet);
    suggestLessSet.forEach((id) => combined.add(id));
    return combined;
  }, [neverShowSet, suggestLessSet]);

  const isHardBanned = useCallback(
    (trackId?: string) => {
      if (!trackId) return false;
      return neverShowSet.has(trackId);
    },
    [neverShowSet]
  );

  const isSuggestLess = useCallback(
    (trackId?: string) => {
      if (!trackId) return false;
      return suggestLessSet.has(trackId);
    },
    [suggestLessSet]
  );

  return {
    neverShowSet,
    suggestLessSet,
    recommendationExclusionSet,
    isHardBanned,
    isSuggestLess,
    isLoading: hatedTracks === undefined || suggestLessTracks === undefined,
  };
}