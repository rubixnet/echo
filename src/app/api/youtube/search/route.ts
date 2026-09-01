import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

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
      const items = rawSongs.map((song) => {
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

      return NextResponse.json({ items });
    }
  } catch (err) {
    console.warn("[Search API] Fast path failed, falling back to Modal...", err);
  }

  const modalUrl = process.env.MODAL_STREAM_URL;
  if (!modalUrl) {
    return NextResponse.json({ error: "MODAL_STREAM_URL not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`${modalUrl}/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Search Fallback Error:", e);
    return NextResponse.json({ error: "Search failed", items: [] }, { status: 500 });
  }
}