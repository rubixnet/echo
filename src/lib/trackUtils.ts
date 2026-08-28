export interface TrackMetadata {
  id?: string;
  trackId?: string;
  title?: string;
  artist?: string;
  coverUrl?: string;
  audioUrl?: string;
  duration?: string | number;
  uploaderName?: string;
  thumbnail?: string;
  source?: {
    type:
      | "search"
      | "category"
      | "playlist"
      | "history"
      | "liked"
      | "player"
      | string;
    name?: string;
    coverUrl?: string;
  };
}

export type QueueType = "user" | "recommendation";

export type QueueItem = NormalizableTrack & {
  queueType?: QueueType;
};

export interface CanonicalTrack {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: string;
  source: {
    type:
      | "search"
      | "category"
      | "playlist"
      | "history"
      | "liked"
      | "player"
      | string;
    name?: string;
  };
}

export interface NormalizableTrack {
  id?: string;
  trackId?: string;
  trackId?: string;
  _id?: string;
  url?: string;
  audioUrl?: string;
  title?: string;
  artist?: string;
  uploaderName?: string;
  coverUrl?: string;
  thumbnail?: string;
  duration?: string | number;
  source?: CanonicalTrack["source"];
  isOfficial?: boolean;
}

export function extracttrackId(raw: unknown): string {
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
  track: NormalizableTrack | null | undefined,
  defaultSourceType: CanonicalTrack["source"]["type"] = "search",
): CanonicalTrack {
  const ytId =
    extracttrackId(track?.trackId) ||
    extracttrackId(track?.id) ||
    extracttrackId(track?.trackId) ||
    extracttrackId(track?.audioUrl) ||
    extracttrackId(track?.url) ||
    extracttrackId(track?._id);

  const durationStr =
    typeof track?.duration === "number"
      ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")}`
      : track?.duration || "0:00";

  return {
    id: ytId,
    trackId: ytId,
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
