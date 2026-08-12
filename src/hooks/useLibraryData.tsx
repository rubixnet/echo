import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useLibraryData(userId: string | undefined) {
  const skip = !userId ? "skip" : { userId: userId as Id<"users"> };
  const playlists = useQuery(api.playlists.getUserPlaylists, skip);
  const likedSongs = useQuery(api.likes.getMyLikes, skip);
  const historySongs = useQuery(api.history.getUserHistory, skip);
  const libraryItems = useQuery(api.library.getLibraryItems, skip);

  const items = libraryItems || []

  const savedTracks = items
    .filter((i) => i.itemType === "track")
    .map((item) => ({
      _id: item._id,
      id: item.itemId,
      youtubeId: item.itemId,
      title: item.title,
      artist: item.subtitle || "Unknown Artist",
      coverUrl: item.coverUrl || "",
      duration: item.metadata?.duration || "0:00",
      audioUrl: item.metadata?.audioUrl || `/api/youtube/stream?id=${item.itemId}`,
      source: item.metadata?.source,
    }));

  const savedArtists = items.filter((i) => i.itemType === "artist")

  const isLoading =
    playlists === undefined ||
    likedSongs === undefined ||
    historySongs === undefined;

  return {
    playlists: playlists || [],
    likedSongs: likedSongs || [],
    historySongs: historySongs || [],
    libraryTracks: savedTracks,
    libraryArtists: savedArtists,
    savedTracks,
    savedArtists,
    libraryItems: items,
    isLoading,
  };
}