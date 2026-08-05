import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useLibraryData(userId: string | undefined) {
  const skip = !userId ? "skip" : { userId: userId as Id<"users"> };

  const playlists = useQuery(api.playlists.getUserPlaylists, skip);
  const likedSongs = useQuery(api.likes.getMyLikes, skip);
  const historySongs = useQuery(api.history.getUserHistory, skip);

  const libraryTracks = useQuery(api.library.getUserLibrary, skip);

  const isLoading =
    playlists === undefined ||
    likedSongs === undefined ||
    historySongs === undefined;

  return {
    playlists: playlists || [],
    likedSongs: likedSongs || [],
    historySongs: historySongs || [],
    libraryTracks: libraryTracks || [],
    isLoading
  };
}