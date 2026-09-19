import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import YTMusic from "ytmusic-api";
import { getBackend } from "@/lib/streamBackend";

const execAsync = promisify(exec);

const ytmusic = new YTMusic();
let isInitialized = false;

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ items: [] });

  try {
    if (!isInitialized) {
      await ytmusic.initialize();
      isInitialized = true;
    }

    const rawSongs = await ytmusic.searchSongs(query);
    if (rawSongs && rawSongs.length > 0) {
      const items = mapSongs(rawSongs);
      return NextResponse.json({ items });
    }
  } catch (err) {
    console.warn("[Search API] Fast path failed, falling back...", err);
  }

  try {
    getBackend();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Backend not configured" },
      { status: 500 }
    );
  }

  if (getBackend().backend === "modal") {
    const modalUrl = getBackend().modalUrl;
    try {
      const res = await fetch(`${modalUrl}/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return NextResponse.json(data);
    } catch (e) {
      console.error("Search Fallback Error:", e);
      return NextResponse.json({ error: "Search failed", items: [] }, { status: 500 });
    }
  }

  return ytDlpSearch(query);
}

function mapSongs(rawSongs: Awaited<ReturnType<typeof ytmusic.searchSongs>>) {
  return rawSongs.map((song) => {
    const videoId = song.videoId;
    const artistName = song.artist?.name || "Unknown Artist";
    const thumbnail =
      song.thumbnails?.[song.thumbnails.length - 1]?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const uploaderLower = artistName.toLowerCase();

    return {
      id: videoId,
      title: song.name || "Untitled Track",
      uploaderName: artistName,
      artist: artistName,
      artistId: song.artist?.artistId || null,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail,
      coverUrl: thumbnail,
      duration: song.duration || 0,
      type: "stream",
      isOfficial:
        uploaderLower.endsWith("vevo") ||
        uploaderLower.endsWith(" - topic") ||
        uploaderLower.includes("official"),
    };
  });
}

async function ytDlpSearch(query: string) {
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
    } catch (err) {
      stdoutString = (err as { stdout?: string })?.stdout || "";
    }

    const items = stdoutString
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line): Record<string, unknown> | null => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((data): data is Record<string, unknown> => data !== null)
      .filter((data) => {
        const duration = Number(data.duration) || 0;
        return duration === 0 || duration <= 600;
      })
      .map((data) => {
        const id = String(data.id);
        const uploaderName = String(data.uploader || "Unknown Artist");
        const uploaderLower = uploaderName.toLowerCase();
        return {
          id,
          title: String(data.title || "Untitled Track"),
          uploaderName,
          artist: uploaderName,
          artistId: null,
          url: String(data.webpage_url || `https://www.youtube.com/watch?v=${id}`),
          thumbnail: String(data.thumbnail || ""),
          coverUrl: String(data.thumbnail || ""),
          duration: Number(data.duration) || 0,
          type: "stream",
          isOfficial:
            data.channel_is_verified === true ||
            uploaderLower.endsWith("vevo") ||
            uploaderLower.endsWith(" - topic"),
        };
      });

    return NextResponse.json({ items });
  } catch (e) {
    console.error("Search Fallback Error:", e);
    return NextResponse.json({ error: "Search failed", items: [] }, { status: 500 });
  }
}