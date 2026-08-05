export interface TrackMetadata {
  id?: string;
  youtubeId?: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
  audioUrl?: string;
  duration?: string | number;
  uploaderName?: string;
  thumbnail?: string;
  source?: {
    type: "search" | "category" | "playlist" | "history" | "liked" | "player" | string;
    name?: string;
    coverUrl?: string;
  };
}

export interface CanonicalTrack {
  id: string; 
  youtubeId: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: string;
  source: {
    type: "search" | "category" | "playlist" | "history" | "liked" | "player" | string;
    name?: string;
  };
}



export function extractYouTubeId(raw: any): string {
  if (!raw || typeof raw !== "string") return "";

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

  const vMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  const idMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]{11})/);
  if (idMatch) return idMatch[1];

  const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  return "";
}

export function normalizeTrack(
  track: any,
  defaultSourceType: CanonicalTrack["source"]["type"] = "search"
): CanonicalTrack {
  const ytId =
    extractYouTubeId(track?.youtubeId) ||
    extractYouTubeId(track?.id) ||
    extractYouTubeId(track?.trackId) ||
    extractYouTubeId(track?.audioUrl) ||
    extractYouTubeId(track?.url) ||
    extractYouTubeId(track?._id);

  const durationStr =
    typeof track?.duration === "number"
      ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`
      : track?.duration || "0:00";

  return {
    id: ytId,
    youtubeId: ytId,
    title: track?.title || "Unknown Track",
    artist: track?.artist || track?.uploaderName || "Unknown Artist",
    coverUrl:
      track?.coverUrl ||
      track?.thumbnail ||
      (ytId
        ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
        : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=256"),
    audioUrl: track?.audioUrl || (ytId ? `/api/youtube/stream?id=${ytId}` : ""),
    duration: durationStr,
    source: track?.source || { type: defaultSourceType },
  };
}