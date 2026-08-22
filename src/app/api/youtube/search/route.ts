import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const ytmusic = new YTMusic();
let isInitialized = false;

const searchCache = new Map<string, { items: any[]; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ items: [] });

  const cacheKey = query.toLowerCase().trim();
  const now = Date.now();

  if (searchCache.has(cacheKey) && searchCache.get(cacheKey)!.expires > now) {
    return NextResponse.json({
      items: searchCache.get(cacheKey)!.items,
      cached: true,
    });
  }

  try {
    if (!isInitialized) {
      await ytmusic.initialize();
      isInitialized = true;
    }

    const rawSongs = await ytmusic.searchSongs(query);

    if (rawSongs && rawSongs.length > 0) {
      const items = rawSongs.map((song: any) => {
        const videoId = song.videoId;
        const artistName = song.artist?.name || "Unknown Artist";
        const thumbnail =
          song.thumbnails?.[song.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        const uploaderLower = artistName.toLowerCase();
        const isOfficial =
          uploaderLower.endsWith("vevo") ||
          uploaderLower.endsWith(" - topic") ||
          uploaderLower.includes("official");

        return {
          id: videoId,
          title: song.name || "Untitled Track",
          uploaderName: artistName,
          artist: artistName,
          artistId: song.artist?.artistId || null,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: thumbnail,
          coverUrl: thumbnail,
          duration: song.duration || 0,
          type: "stream",
          isOfficial: isOfficial,
        };
      });

      searchCache.set(cacheKey, { items, expires: now + CACHE_TTL });
      return NextResponse.json({ items });
    }
  } catch (err) {
    console.warn(
      "[Search API] Fast path failed, falling back to yt-dlp...",
      err,
    );
  }

  try {
    const safeQuery = query.replace(/"/g, "");
    const FALLBACK_LIMIT = 2;
    let stdoutString = "";

    try {
      const { stdout } = await execAsync(
        `yt-dlp --no-warnings --ignore-errors -j "ytsearch${FALLBACK_LIMIT}:${safeQuery}"`,
        { maxBuffer: 10 * 1024 * 1024 },
      );
      stdoutString = stdout;
    } catch (err: any) {
      stdoutString = err.stdout || "";
    }

    const items = stdoutString
      .trim()
      .split("\n")
      .map((line) => {
        try {
          if (!line) return null;
          const data = JSON.parse(line);
          if (data.duration && data.duration > 600) return null;

          const uploaderName = data.uploader ? data.uploader.toLowerCase() : "";
          const isOfficial =
            data.channel_is_verified === true ||
            uploaderName.endsWith("vevo") ||
            uploaderName.endsWith(" - topic");

          return {
            id: data.id,
            title: data.title,
            uploaderName: data.uploader,
            artist: data.uploader,
            artistId: null,
            url:
              data.webpage_url || `https://www.youtube.com/watch?v=${data.id}`,
            thumbnail: data.thumbnail,
            coverUrl: data.thumbnail,
            duration: data.duration,
            type: "stream",
            isOfficial: isOfficial,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (items.length > 0) {
      searchCache.set(cacheKey, { items, expires: now + CACHE_TTL });
    }

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("Search Fallback Error:", e.message);
    return NextResponse.json(
      { error: "Search failed", items: [] },
      { status: 500 },
    );
  }
}
