import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const HF_SPACE_URL = "https://rubixnet-fastapi.hf.space";
const HF_TOKEN = process.env.HF_TOKEN; 

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist")?.trim();
  const title = searchParams.get("title")?.trim();
  const duration = searchParams.get("duration");

  if (!artist || !title) {
    return NextResponse.json({ error: "Missing artist or title" }, { status: 400 });
  }

  const queryParams = new URLSearchParams({ artist, title });
  if (duration) queryParams.set("duration", duration);

  try {
    const hfController = new AbortController();
    const hfTimeout = setTimeout(() => hfController.abort(), 3000); 

    const hfHeaders: HeadersInit = {};
    if (HF_TOKEN) {
      hfHeaders["Authorization"] = `Bearer ${HF_TOKEN}`;
    }

    const hfRes = await fetch(`${HF_SPACE_URL}/api/get?${queryParams}`, {
      headers: hfHeaders,
      signal: hfController.signal,
    });
    clearTimeout(hfTimeout);

    if (hfRes.ok) {
      const data = await hfRes.json();
      return NextResponse.json(data, {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" },
      });
    }
  } catch {
  }

  try {
    const liveController = new AbortController();
    const liveTimeout = setTimeout(() => liveController.abort(), 5000);

    const liveParams = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    if (duration) liveParams.set("duration", Math.round(Number(duration)).toString());

    const liveRes = await fetch(`https://lrclib.net/api/get?${liveParams}`, {
      headers: {
        "User-Agent": "MyMusicApp/1.0 (https://github.com/my-music-app)",
      },
      signal: liveController.signal,
    });
    clearTimeout(liveTimeout);

    if (liveRes.ok) {
      const data = await liveRes.json();
      const formatted = {
        track_name: data.track_name,
        artist_name: data.artist_name,
        album_name: data.album_name,
        duration: data.duration,
        instrumental: data.instrumental,
        plain_lyrics: data.plain_lyrics,
        synced_lyrics: data.synced_lyrics,
      };

      return NextResponse.json(formatted, {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" },
      });
    }
  } catch {
  }

  return NextResponse.json(
    { error: "Lyrics not found" },
    {
      status: 404,
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    }
  );
}