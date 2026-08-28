import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

const ytmusic = new YTMusic();
let isInitialized = false;

interface YtSongSummary {
  videoId?: string;
  id?: string;
  name?: string;
  title?: string;
  duration?: number | string;
  artistId?: string;
  artist?: { name?: string; artistId?: string };
  artists?: { name?: string }[];
  thumbnails?: { url?: string }[];
}

interface RelatedItem {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  artistId: string | null;
  coverUrl: string;
  duration: number;
  audioUrl: string;
}

const relatedCache = new Map<string, { items: RelatedItem[]; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("id");
    const excludeParam = searchParams.get("exclude") || "";


    if (!videoId) {
      return NextResponse.json({ items: [] }, { status: 400 });
    }

    const excludeSet = new Set<string>([
      videoId,
      ...excludeParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ]);

    const now = Date.now();

    if (relatedCache.has(videoId) && relatedCache.get(videoId)!.expires > now) {
      const cachedItems = relatedCache.get(videoId)!.items;
      const filtered = cachedItems.filter(
        (item) => !excludeSet.has(item.id || item.trackId),
      );
      return NextResponse.json({ items: filtered });
    }

    if (!isInitialized) {
      await ytmusic.initialize().catch(() => {});
      isInitialized = true;
    }


    let rawSongs = [] as unknown as YtSongSummary[];
    let resolvedArtistName = "";

    try {
      const songInfo = (await ytmusic.getSong(videoId)) as unknown as {
        artist?: { name?: string };
      };
      if (songInfo) {
        resolvedArtistName = songInfo.artist?.name || "";
      }
    } catch (err) {
      console.warn("[Related API] getSong lookup failed:", err);
    }

    if (resolvedArtistName) {
      try {
        rawSongs = (await ytmusic.searchSongs(
          `${resolvedArtistName} top songs`,
        )) as unknown as YtSongSummary[];
      } catch (err) {
        console.warn("[Related API] Artist top songs search failed:", err);
      }
    }

    if (!rawSongs || rawSongs.length === 0) {
      try {
        rawSongs = (await ytmusic.searchSongs(
          "top trending music songs",
        )) as unknown as YtSongSummary[];
      } catch (err) {
        console.warn("[Related API] General fallback search failed:", err);
      }
    }

    if (!rawSongs || rawSongs.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const seenIds = new Set<string>();
    const results: RelatedItem[] = [];

    for (const song of rawSongs) {
      const vId = song.videoId || song.id;
      if (!vId || seenIds.has(vId) || excludeSet.has(vId)) continue;

      const duration = typeof song.duration === "number" ? song.duration : 0;
      const title = song.name || song.title || "Untitled Track";
      const lowerTitle = title.toLowerCase();

      if (duration > 600) continue;
      if (
        lowerTitle.includes("podcast") ||
        lowerTitle.includes("episode") ||
        lowerTitle.includes("full album") ||
        lowerTitle.includes("live stream")
      ) {
        continue;
      }

      const artist =
        song.artist?.name ||
        (Array.isArray(song.artists) && song.artists[0]?.name) ||
        resolvedArtistName ||
        "Unknown Artist";

      const thumbnail =
        song.thumbnails?.[song.thumbnails.length - 1]?.url ||
        `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

      const mappedTrack = {
        id: vId,
        trackId: vId,
        title: title,
        artist: artist,
        artistId: song.artist?.artistId || null,
        coverUrl: thumbnail,
        duration: duration,
        audioUrl: `/api/youtube/stream?id=${vId}`,
      };

      seenIds.add(vId);
      results.push(mappedTrack);
    }

    if (results.length > 0) {
      relatedCache.set(videoId, { items: results, expires: now + CACHE_TTL });
    }

    return NextResponse.json({ items: results.slice(0, 8) });
  } catch (error) {
    console.error("Related API Error:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
